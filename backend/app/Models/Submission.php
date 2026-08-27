<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Submission extends Model
{
    use HasFactory;

    protected $fillable = [
        'mission_id',
        'user_id',
        'latitude',
        'longitude',
        'submitted_latitude',
        'submitted_longitude',
        'gps_accuracy',
        'gps_distance_meters',
        'distance_from_target_meters',
        'answers',
        'photos',
        'photo_urls',
        'device_id',
        'submission_hash',
        'status',
        'reviewed_by',
        'reviewed_at',
        'validated_at',
        'rejected_at',
        'auto_validated_at',
        'rejection_reason',
    ];

    protected $casts = [
        'answers' => 'array',
        'photos' => 'array',
        'photo_urls' => 'array',
        'latitude' => 'float',
        'longitude' => 'float',
        'submitted_latitude' => 'float',
        'submitted_longitude' => 'float',
        'gps_accuracy' => 'float',
        'gps_distance_meters' => 'float',
        'distance_from_target_meters' => 'integer',
        'reviewed_at' => 'datetime',
        'validated_at' => 'datetime',
        'rejected_at' => 'datetime',
        'auto_validated_at' => 'datetime',
    ];

    public function mission(): BelongsTo
    {
        return $this->belongsTo(Mission::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function contributor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }
}
