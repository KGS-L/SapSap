<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Mission extends Model
{
    use HasFactory;

    protected $fillable = [
        'campaign_id',
        'title',
        'description',
        'mission_type',
        'location_name',
        'latitude',
        'longitude',
        'radius_meters',
        'reward',
        'reward_amount',
        'required_photos_count',
        'questionnaire_schema',
        'status',
        'assigned_user_id',
        'assigned_at',
        'reserved_at',
        'expires_at',
        'reservation_expires_at',
        'submitted_at',
    ];

    protected $casts = [
        'latitude' => 'float',
        'longitude' => 'float',
        'radius_meters' => 'integer',
        'reward' => 'integer',
        'reward_amount' => 'integer',
        'required_photos_count' => 'integer',
        'questionnaire_schema' => 'array',
        'assigned_at' => 'datetime',
        'reserved_at' => 'datetime',
        'expires_at' => 'datetime',
        'reservation_expires_at' => 'datetime',
        'submitted_at' => 'datetime',
    ];

    public function campaign(): BelongsTo
    {
        return $this->belongsTo(Campaign::class);
    }

    public function assignedUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_user_id');
    }

    public function submissions(): HasMany
    {
        return $this->hasMany(Submission::class);
    }

    public function latestSubmission(): HasOne
    {
        return $this->hasOne(Submission::class)->latestOfMany();
    }
}
