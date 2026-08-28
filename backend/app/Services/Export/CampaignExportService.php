<?php

namespace App\Services\Export;

use App\Models\Campaign;
use Illuminate\Http\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class CampaignExportService
{
    /**
     * Retourne les en-têtes standard pour les exports de campagne
     */
    public function getHeaders(): array
    {
        return [
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
    }

    /**
     * Structure et filtre les données de missions et soumissions pour l'exportation
     */
    public function prepareRows(Campaign $campaign, ?string $statusFilter = null, ?string $neighborhoodFilter = null): array
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

    /**
     * Génère un flux de téléchargement CSV avec BOM UTF-8 et séparateur point-virgule
     */
    public function exportCsv(Campaign $campaign, ?string $statusFilter = null, ?string $neighborhoodFilter = null): StreamedResponse
    {
        $rows = $this->prepareRows($campaign, $statusFilter, $neighborhoodFilter);
        $headers = $this->getHeaders();

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
     * Génère un flux de téléchargement Excel au format XML SpreadsheetML stylisé
     */
    public function exportExcel(Campaign $campaign, ?string $statusFilter = null, ?string $neighborhoodFilter = null): Response
    {
        $rows = $this->prepareRows($campaign, $statusFilter, $neighborhoodFilter);
        $headers = $this->getHeaders();

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
}
