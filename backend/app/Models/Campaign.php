<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

class Campaign extends Model
{
    use HasFactory;

    protected $fillable = [
        'company_id',
        'user_id',
        'company_name',
        'title',
        'description',
        'type',
        'mission_type',
        'city',
        'location_city',
        'target_neighborhoods',
        'target_district',
        'criteria',
        'questionnaire_schema',
        'required_photos_count',
        'missions_count',
        'total_missions_requested',
        'reward_per_mission',
        'subtotal_amount',
        'platform_fee_amount',
        'total_budget',
        'total_budget_amount',
        'escrow_balance',
        'status',
        'rejection_reason',
        'approved_at',
        'rejected_at',
    ];

    protected $casts = [
        'target_neighborhoods' => 'array',
        'criteria' => 'array',
        'questionnaire_schema' => 'array',
        'required_photos_count' => 'integer',
        'missions_count' => 'integer',
        'total_missions_requested' => 'integer',
        'reward_per_mission' => 'integer',
        'subtotal_amount' => 'integer',
        'platform_fee_amount' => 'integer',
        'total_budget' => 'integer',
        'total_budget_amount' => 'integer',
        'escrow_balance' => 'integer',
        'approved_at' => 'datetime',
        'rejected_at' => 'datetime',
    ];

    /**
     * Relation avec l'entreprise (User avec rôle company-admin / company-viewer).
     */
    public function company(): BelongsTo
    {
        return $this->belongsTo(User::class, 'company_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Relation avec les missions générées pour cette campagne.
     */
    public function missions(): HasMany
    {
        return $this->hasMany(Mission::class);
    }

    public function submissions(): HasManyThrough
    {
        return $this->hasManyThrough(Submission::class, Mission::class);
    }
}
