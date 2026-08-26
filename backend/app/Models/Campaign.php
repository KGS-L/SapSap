<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Campaign extends Model
{
    use HasFactory;

    protected $fillable = [
        'company_id',
        'title',
        'description',
        'mission_type',
        'location_city',
        'target_district',
        'questionnaire_schema',
        'required_photos_count',
        'total_missions_requested',
        'reward_per_mission',
        'subtotal_amount',
        'platform_fee_amount',
        'total_budget_amount',
        'escrow_balance',
        'status',
    ];

    protected $casts = [
        'questionnaire_schema' => 'array',
        'required_photos_count' => 'integer',
        'total_missions_requested' => 'integer',
        'reward_per_mission' => 'integer',
        'subtotal_amount' => 'integer',
        'platform_fee_amount' => 'integer',
        'total_budget_amount' => 'integer',
        'escrow_balance' => 'integer',
    ];

    /**
     * Relation avec l'entreprise (User avec rôle company-admin / company-viewer).
     */
    public function company(): BelongsTo
    {
        return $this->belongsTo(User::class, 'company_id');
    }
}
