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
        'status',
        'answers',
        'photos',
        'submitted_latitude',
        'submitted_longitude',
        'gps_accuracy',
        'gps_distance_meters',
        'device_id',
        'rejection_reason',
        'validated_at',
        'rejected_at',
        'auto_validated_at',
    ];

    protected function casts(): array
    {
        return [
            'answers' => 'array',
            'photos' => 'array',
            'submitted_latitude' => 'float',
            'submitted_longitude' => 'float',
            'gps_accuracy' => 'float',
            'gps_distance_meters' => 'float',
            'validated_at' => 'datetime',
            'rejected_at' => 'datetime',
            'auto_validated_at' => 'datetime',
        ];
    }

    public function mission(): BelongsTo
    {
        return $this->belongsTo(Mission::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
