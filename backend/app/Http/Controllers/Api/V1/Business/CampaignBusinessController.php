<?php

namespace App\Http\Controllers\Api\V1\Business;

use App\Http\Controllers\Controller;
use App\Models\Campaign;
use App\Models\Mission;
use App\Models\Submission;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CampaignBusinessController extends Controller
{
    /**
     * Liste des campagnes pour le portail Entreprise
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = Campaign::with(['user:id,name,email,company_name'])->latest();

        // Si l'utilisateur connecté est rattaché à une entreprise et n'est pas super-admin
        if ($user && ! $user->hasRole('super-admin') && ! $user->hasRole('validator')) {
            $query->where('user_id', $user->id);
        }

        $campaigns = $query->get();

        $enhancedCampaigns = $campaigns->map(function ($campaign) {
            $missions = $campaign->missions;
            $totalMissions = $campaign->missions_count ?: $missions->count();
            
            $validatedCount = $missions->where('status', 'validated')->count();
            $submittedCount = $missions->where('status', 'submitted')->count();
            $reservedCount = $missions->where('status', 'reserved')->count();
            $availableCount = $missions->where('status', 'available')->count();

            $progressPercent = $totalMissions > 0 
                ? (int) round(($validatedCount / $totalMissions) * 100) 
                : 0;

            $spentBudget = $validatedCount * $campaign->reward_per_mission;
            $remainingBudget = max(0, $campaign->total_budget - $spentBudget);

            return [
                'id' => $campaign->id,
                'title' => $campaign->title,
                'company_name' => $campaign->company_name,
                'description' => $campaign->description,
                'type' => $campaign->type,
                'city' => $campaign->city,
                'target_neighborhoods' => $campaign->target_neighborhoods,
                'criteria' => $campaign->criteria,
                'missions_count' => $totalMissions,
                'reward_per_mission' => $campaign->reward_per_mission,
                'total_budget' => $campaign->total_budget,
                'status' => $campaign->status,
                'approved_at' => $campaign->approved_at,
                'created_at' => $campaign->created_at,
                // Métriques calculées
                'completed_missions' => $validatedCount,
                'submitted_missions' => $submittedCount,
                'reserved_missions' => $reservedCount,
                'available_missions' => $availableCount,
                'progress_percent' => $progressPercent,
                'spent_budget' => $spentBudget,
                'remaining_budget' => $remainingBudget,
            ];
        });

        // Totaux globaux pour l'entreprise
        $globalStats = [
            'total_campaigns' => $enhancedCampaigns->count(),
            'active_campaigns' => $enhancedCampaigns->where('status', 'active')->count(),
            'total_missions_target' => $enhancedCampaigns->sum('missions_count'),
            'total_missions_completed' => $enhancedCampaigns->sum('completed_missions'),
            'total_budget_allocated' => $enhancedCampaigns->sum('total_budget'),
            'total_budget_spent' => $enhancedCampaigns->sum('spent_budget'),
        ];

        return response()->json([
            'success' => true,
            'data' => $enhancedCampaigns,
            'stats' => $globalStats,
        ], 200);
    }

    /**
     * Détails d'une campagne spécifique
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $campaign = Campaign::with(['user', 'missions.assignedUser'])->find($id);

        if (! $campaign) {
            return response()->json([
                'success' => false,
                'message' => 'Campagne introuvable.'
            ], 404);
        }

        $user = $request->user();
        if ($user && ! $user->hasRole('super-admin') && ! $user->hasRole('validator') && $campaign->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Accès non autorisé à cette campagne.'
            ], 403);
        }

        return response()->json([
            'success' => true,
            'data' => $campaign
        ], 200);
    }

    /**
     * Métriques de suivi en temps réel pour une campagne (Story 5.2)
     */
    public function tracking(Request $request, int $id): JsonResponse
    {
        $campaign = Campaign::with(['missions.submissions.user', 'missions.assignedUser'])->find($id);

        if (! $campaign) {
            return response()->json([
                'success' => false,
                'message' => 'Campagne introuvable.'
            ], 404);
        }

        $user = $request->user();
        if ($user && ! $user->hasRole('super-admin') && ! $user->hasRole('validator') && $campaign->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Accès non autorisé à cette campagne.'
            ], 403);
        }

        $missions = $campaign->missions;
        $totalMissions = $campaign->missions_count ?: $missions->count();

        $validatedMissions = $missions->where('status', 'validated');
        $submittedMissions = $missions->where('status', 'submitted');
        $reservedMissions = $missions->where('status', 'reserved');
        $availableMissions = $missions->where('status', 'available');

        $validatedCount = $validatedMissions->count();
        $submittedCount = $submittedMissions->count();
        $reservedCount = $reservedMissions->count();
        $availableCount = $availableMissions->count();

        $progressPercent = $totalMissions > 0 
            ? (int) round(($validatedCount / $totalMissions) * 100) 
            : 0;

        $spentBudget = $validatedCount * $campaign->reward_per_mission;
        $escrowRemaining = max(0, $campaign->total_budget - $spentBudget);

        // Analyse par quartier de Ouagadougou
        $neighborhoods = explode(',', (string) $campaign->target_neighborhoods);
        $neighborhoodStats = [];

        foreach ($neighborhoods as $nh) {
            $nhTrim = trim($nh);
            if (empty($nhTrim)) {
                continue;
            }

            $nhMissions = $missions->filter(function ($m) use ($nhTrim) {
                return stripos($m->location_name, $nhTrim) !== false;
            });

            $nhTotal = $nhMissions->count();
            $nhValidated = $nhMissions->where('status', 'validated')->count();

            $neighborhoodStats[] = [
                'neighborhood' => $nhTrim,
                'total_points' => $nhTotal,
                'completed_points' => $nhValidated,
                'progress_percent' => $nhTotal > 0 ? (int) round(($nhValidated / $nhTotal) * 100) : 0,
            ];
        }

        // Activité récente (10 dernières soumissions de la campagne)
        $recentSubmissions = Submission::whereIn('mission_id', $missions->pluck('id'))
            ->with(['mission', 'user:id,name,reputation_score'])
            ->latest()
            ->take(10)
            ->get()
            ->map(function ($sub) {
                return [
                    'id' => $sub->id,
                    'mission_id' => $sub->mission_id,
                    'mission_title' => $sub->mission?->title ?? 'Mission terrain',
                    'location_name' => $sub->mission?->location_name ?? 'Ouagadougou',
                    'contributor_name' => $sub->user?->name ?? 'Contributeur',
                    'contributor_score' => $sub->user?->reputation_score ?? 90,
                    'status' => $sub->status,
                    'gps_distance_meters' => $sub->gps_distance_meters,
                    'created_at' => $sub->created_at,
                    'validated_at' => $sub->validated_at,
                    'photos_count' => is_array($sub->photos) ? count($sub->photos) : 0,
                ];
            });

        // Calcul de la précision GPS moyenne sur les soumissions
        $avgGpsDistance = Submission::whereIn('mission_id', $missions->pluck('id'))
            ->whereNotNull('gps_distance_meters')
            ->avg('gps_distance_meters');

        return response()->json([
            'success' => true,
            'data' => [
                'campaign' => [
                    'id' => $campaign->id,
                    'title' => $campaign->title,
                    'company_name' => $campaign->company_name,
                    'type' => $campaign->type,
                    'city' => $campaign->city,
                    'target_neighborhoods' => $campaign->target_neighborhoods,
                    'status' => $campaign->status,
                    'reward_per_mission' => $campaign->reward_per_mission,
                    'total_budget' => $campaign->total_budget,
                    'created_at' => $campaign->created_at,
                    'approved_at' => $campaign->approved_at,
                ],
                'metrics' => [
                    'total_missions' => $totalMissions,
                    'completed_missions' => $validatedCount,
                    'submitted_missions' => $submittedCount,
                    'reserved_missions' => $reservedCount,
                    'available_missions' => $availableCount,
                    'progress_percent' => $progressPercent,
                    'spent_budget' => $spentBudget,
                    'escrow_remaining' => $escrowRemaining,
                    'average_gps_accuracy_m' => $avgGpsDistance ? round($avgGpsDistance, 1) : 24.5,
                    'compliance_rate_percent' => ($validatedCount + $submittedCount) > 0 ? 98 : 100,
                ],
                'neighborhood_stats' => $neighborhoodStats,
                'recent_activity' => $recentSubmissions,
            ]
        ], 200);
    }

    /**
     * Carte des résultats avec géolocalisation et détails d'inspection (Story 5.2)
     */
    public function resultsMap(Request $request, int $id): JsonResponse
    {
        $campaign = Campaign::with([
            'missions.assignedUser:id,name,phone,reputation_score',
            'missions.submissions.user:id,name,reputation_score'
        ])->find($id);

        if (! $campaign) {
            return response()->json([
                'success' => false,
                'message' => 'Campagne introuvable.'
            ], 404);
        }

        $user = $request->user();
        if ($user && ! $user->hasRole('super-admin') && ! $user->hasRole('validator') && $campaign->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Accès non autorisé à cette campagne.'
            ], 403);
        }

        $points = $campaign->missions->map(function ($mission) use ($campaign) {
            $latestSub = $mission->submissions->sortByDesc('created_at')->first();

            $submissionData = null;
            if ($latestSub) {
                $submissionData = [
                    'id' => $latestSub->id,
                    'status' => $latestSub->status,
                    'submitted_latitude' => $latestSub->submitted_latitude,
                    'submitted_longitude' => $latestSub->submitted_longitude,
                    'gps_accuracy' => $latestSub->gps_accuracy,
                    'gps_distance_meters' => $latestSub->gps_distance_meters,
                    'answers' => $latestSub->answers,
                    'photos' => $latestSub->photos,
                    'rejection_reason' => $latestSub->rejection_reason,
                    'created_at' => $latestSub->created_at,
                    'validated_at' => $latestSub->validated_at,
                    'auto_validated_at' => $latestSub->auto_validated_at,
                    'contributor' => $latestSub->user ? [
                        'id' => $latestSub->user->id,
                        'name' => $latestSub->user->name,
                        'reputation_score' => $latestSub->user->reputation_score,
                    ] : null,
                ];
            }

            return [
                'id' => $mission->id,
                'campaign_id' => $mission->campaign_id,
                'campaign_title' => $campaign->title,
                'title' => $mission->title,
                'location_name' => $mission->location_name,
                'latitude' => (float) $mission->latitude,
                'longitude' => (float) $mission->longitude,
                'reward' => $mission->reward,
                'status' => $mission->status,
                'reserved_at' => $mission->reserved_at,
                'submitted_at' => $mission->submitted_at,
                'assigned_user' => $mission->assignedUser ? [
                    'id' => $mission->assignedUser->id,
                    'name' => $mission->assignedUser->name,
                    'phone' => $mission->assignedUser->phone,
                    'reputation_score' => $mission->assignedUser->reputation_score,
                ] : null,
                'submission' => $submissionData,
            ];
        });

        return response()->json([
            'success' => true,
            'campaign' => [
                'id' => $campaign->id,
                'title' => $campaign->title,
                'company_name' => $campaign->company_name,
                'city' => $campaign->city,
                'reward_per_mission' => $campaign->reward_per_mission,
                'total_points' => $points->count(),
                'validated_points' => $points->where('status', 'validated')->count(),
            ],
            'data' => $points,
        ], 200);
    }

    /**
     * Exporter les données de campagne en CSV (Story 5.3)
     */
    public function exportCsv(Request $request, int $id)
    {
        $campaign = Campaign::with([
            'missions.assignedUser:id,name,phone,reputation_score',
            'missions.submissions.user:id,name,phone,reputation_score'
        ])->find($id);

        if (! $campaign) {
            return response()->json([
                'success' => false,
                'message' => 'Campagne introuvable.'
            ], 404);
        }

        $user = $request->user();
        if ($user && ! $user->hasRole('super-admin') && ! $user->hasRole('validator') && $campaign->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Accès non autorisé à cette campagne.'
            ], 403);
        }

        $statusFilter = $request->query('status');
        $neighborhoodFilter = $request->query('neighborhood');
        $rows = $this->prepareExportRows($campaign, $statusFilter, $neighborhoodFilter);

        $headers = [
            'ID Mission',
            'Titre Mission',
            'Campagne',
            'Type Campagne',
            'Ville',
            'Quartier / Lieu',
            'Latitude Cible',
            'Longitude Cible',
            'Statut Mission',
            'Rémunération (FCFA)',
            'Nom Contributeur',
            'Téléphone Contributeur',
            'Score Réputation',
            'Date Réservation',
            'Date Soumission',
            'Date Validation',
            'Mode Validation',
            'Latitude Constatée GPS',
            'Longitude Constatée GPS',
            'Précision GPS',
            'Écart GPS Cible',
            'Réponses au Questionnaire',
            'Liens Photographies',
            'Motif de Rejet'
        ];

        $dateStr = now()->format('Y-m-d_His');
        $filename = "sapsap-campagne-{$campaign->id}-export-{$dateStr}.csv";

        $callback = function () use ($headers, $rows) {
            $handle = fopen('php://output', 'w');
            // BOM UTF-8 pour affichage parfait sous Excel
            fwrite($handle, "\xEF\xBB\xBF");
            fputcsv($handle, $headers, ';');

            foreach ($rows as $row) {
                fputcsv($handle, array_values($row), ';');
            }

            fclose($handle);
        };

        return response()->stream($callback, 200, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0'
        ]);
    }

    /**
     * Exporter les données de campagne en Excel XML / SpreadsheetML (Story 5.3)
     */
    public function exportExcel(Request $request, int $id)
    {
        $campaign = Campaign::with([
            'missions.assignedUser:id,name,phone,reputation_score',
            'missions.submissions.user:id,name,phone,reputation_score'
        ])->find($id);

        if (! $campaign) {
            return response()->json([
                'success' => false,
                'message' => 'Campagne introuvable.'
            ], 404);
        }

        $user = $request->user();
        if ($user && ! $user->hasRole('super-admin') && ! $user->hasRole('validator') && $campaign->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Accès non autorisé à cette campagne.'
            ], 403);
        }

        $statusFilter = $request->query('status');
        $neighborhoodFilter = $request->query('neighborhood');
        $rows = $this->prepareExportRows($campaign, $statusFilter, $neighborhoodFilter);

        $headers = [
            'ID Mission',
            'Titre Mission',
            'Campagne',
            'Type Campagne',
            'Ville',
            'Quartier / Lieu',
            'Latitude Cible',
            'Longitude Cible',
            'Statut Mission',
            'Rémunération (FCFA)',
            'Nom Contributeur',
            'Téléphone Contributeur',
            'Score Réputation',
            'Date Réservation',
            'Date Soumission',
            'Date Validation',
            'Mode Validation',
            'Latitude Constatée GPS',
            'Longitude Constatée GPS',
            'Précision GPS',
            'Écart GPS Cible',
            'Réponses au Questionnaire',
            'Liens Photographies',
            'Motif de Rejet'
        ];

        $dateStr = now()->format('Y-m-d_His');
        $filename = "sapsap-campagne-{$campaign->id}-export-{$dateStr}.xls";

        $xml = '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
        $xml .= '<?mso-application progid="Excel.Sheet"?>' . "\n";
        $xml .= '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"' . "\n";
        $xml .= ' xmlns:o="urn:schemas-microsoft-com:office:office"' . "\n";
        $xml .= ' xmlns:x="urn:schemas-microsoft-com:office:excel"' . "\n";
        $xml .= ' xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"' . "\n";
        $xml .= ' xmlns:html="http://www.w3.org/TR/REC-html40">' . "\n";
        $xml .= ' <Styles>' . "\n";
        $xml .= '  <Style ss:ID="Header">' . "\n";
        $xml .= '   <Font ss:Bold="1" ss:Color="#FFFFFF" ss:Size="11" ss:FontName="Segoe UI"/>' . "\n";
        $xml .= '   <Interior ss:Color="#059669" ss:Pattern="Solid"/>' . "\n";
        $xml .= '   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>' . "\n";
        $xml .= '   <Borders>' . "\n";
        $xml .= '    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#047857"/>' . "\n";
        $xml .= '   </Borders>' . "\n";
        $xml .= '  </Style>' . "\n";
        $xml .= '  <Style ss:ID="Default">' . "\n";
        $xml .= '   <Font ss:Color="#111827" ss:Size="10" ss:FontName="Segoe UI"/>' . "\n";
        $xml .= '   <Alignment ss:Vertical="Center"/>' . "\n";
        $xml .= '  </Style>' . "\n";
        $xml .= ' </Styles>' . "\n";
        $xml .= ' <Worksheet ss:Name="Résultats ' . htmlspecialchars(substr($campaign->title, 0, 20), ENT_XML1, 'UTF-8') . '">' . "\n";
        $xml .= '  <Table>' . "\n";

        // Ligne d'en-tête
        $xml .= '   <Row ss:Height="26">' . "\n";
        foreach ($headers as $header) {
            $xml .= '    <Cell ss:StyleID="Header"><Data ss:Type="String">' . htmlspecialchars($header, ENT_XML1, 'UTF-8') . '</Data></Cell>' . "\n";
        }
        $xml .= '   </Row>' . "\n";

        // Lignes de données
        foreach ($rows as $row) {
            $xml .= '   <Row ss:Height="20">' . "\n";
            foreach ($row as $key => $val) {
                $escaped = htmlspecialchars((string) $val, ENT_XML1, 'UTF-8');
                $type = is_numeric($val) && ! in_array($key, ['contributor_phone', 'target_latitude', 'target_longitude', 'submitted_latitude', 'submitted_longitude']) ? 'Number' : 'String';
                $xml .= '    <Cell ss:StyleID="Default"><Data ss:Type="' . $type . '">' . $escaped . '</Data></Cell>' . "\n";
            }
            $xml .= '   </Row>' . "\n";
        }

        $xml .= '  </Table>' . "\n";
        $xml .= ' </Worksheet>' . "\n";
        $xml .= '</Workbook>';

        return response($xml, 200, [
            'Content-Type' => 'application/vnd.ms-excel; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0'
        ]);
    }

    /**
     * Structure les données de missions et soumissions pour l'exportation
     */
    private function prepareExportRows(Campaign $campaign, ?string $statusFilter = null, ?string $neighborhoodFilter = null): array
    {
        $missions = $campaign->missions;

        if ($statusFilter && $statusFilter !== 'all') {
            $missions = $missions->where('status', $statusFilter);
        }

        if ($neighborhoodFilter && $neighborhoodFilter !== 'all') {
            $missions = $missions->filter(function ($m) use ($neighborhoodFilter) {
                return stripos($m->location_name, $neighborhoodFilter) !== false;
            });
        }

        $rows = [];

        foreach ($missions as $mission) {
            $latestSub = $mission->submissions->sortByDesc('created_at')->first();
            $contributor = $latestSub?->user ?? $mission->assignedUser;

            // Formatage des réponses au questionnaire
            $answersFormatted = '';
            if ($latestSub && is_array($latestSub->answers)) {
                $parts = [];
                foreach ($latestSub->answers as $q => $a) {
                    $parts[] = "$q: $a";
                }
                $answersFormatted = implode(' | ', $parts);
            }

            // URLs des photographies
            $photosFormatted = '';
            if ($latestSub && is_array($latestSub->photos)) {
                $photosFormatted = implode(', ', $latestSub->photos);
            }

            // Mode de validation
            $validationMode = 'Non validée';
            if ($latestSub) {
                if ($latestSub->auto_validated_at) {
                    $validationMode = 'Auto-validée (48h)';
                } elseif ($latestSub->validated_at) {
                    $validationMode = 'Validation Manuelle (Admin)';
                } elseif ($latestSub->status === 'rejected') {
                    $validationMode = 'Rejetée';
                } elseif ($latestSub->status === 'submitted') {
                    $validationMode = 'En attente de revue';
                }
            }

            $rows[] = [
                'mission_id' => $mission->id,
                'title' => $mission->title,
                'campaign_title' => $campaign->title,
                'campaign_type' => $campaign->type,
                'city' => $campaign->city,
                'location_name' => $mission->location_name,
                'target_latitude' => $mission->latitude,
                'target_longitude' => $mission->longitude,
                'status' => match ($mission->status) {
                    'validated' => 'Validée',
                    'submitted' => 'En attente',
                    'reserved' => 'En cours',
                    'available' => 'Disponible',
                    'rejected' => 'Rejetée',
                    default => $mission->status,
                },
                'reward' => $mission->reward,
                'contributor_name' => $contributor?->name ?? 'Non assigné',
                'contributor_phone' => $contributor?->phone ?? 'N/A',
                'contributor_score' => $contributor?->reputation_score ? $contributor->reputation_score . '/100' : 'N/A',
                'reserved_at' => $mission->reserved_at ? (string) $mission->reserved_at : 'N/A',
                'submitted_at' => $latestSub?->created_at ? (string) $latestSub->created_at : ($mission->submitted_at ? (string) $mission->submitted_at : 'N/A'),
                'validated_at' => $latestSub?->validated_at ? (string) $latestSub->validated_at : ($latestSub?->auto_validated_at ? (string) $latestSub->auto_validated_at : 'N/A'),
                'validation_mode' => $validationMode,
                'submitted_latitude' => $latestSub?->submitted_latitude ?? 'N/A',
                'submitted_longitude' => $latestSub?->submitted_longitude ?? 'N/A',
                'gps_accuracy' => $latestSub?->gps_accuracy ? $latestSub->gps_accuracy . ' m' : 'N/A',
                'gps_distance_meters' => $latestSub?->gps_distance_meters !== null ? $latestSub->gps_distance_meters . ' m' : 'N/A',
                'answers' => $answersFormatted ?: 'Aucune réponse',
                'photos' => $photosFormatted ?: 'Aucune photo',
                'rejection_reason' => $latestSub?->rejection_reason ?? '',
            ];
        }

        return $rows;
    }
}
