<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SchedulerLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'job_name',
        'executed_at',
        'processed_count',
        'status',
        'details',
        'triggered_by',
        'admin_user_id',
    ];

    protected function casts(): array
    {
        return [
            'executed_at' => 'datetime',
            'processed_count' => 'integer',
            'details' => 'array',
        ];
    }

    public function adminUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'admin_user_id');
    }
}
