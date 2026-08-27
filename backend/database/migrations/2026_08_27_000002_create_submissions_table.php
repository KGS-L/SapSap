<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('submissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('mission_id')->constrained('missions')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade'); // Contributeur
            $table->enum('status', ['submitted', 'validated', 'rejected', 'fraud_suspect'])->default('submitted');
            $table->json('answers')->nullable(); // Questions/Réponses du formulaire
            $table->json('photos')->nullable(); // URLs ou chemins des photos capturées
            $table->decimal('submitted_latitude', 10, 7)->nullable();
            $table->decimal('submitted_longitude', 10, 7)->nullable();
            $table->decimal('gps_accuracy', 8, 2)->default(5.0); // Précision GPS en mètres
            $table->decimal('gps_distance_meters', 10, 2)->default(0.0); // Écart par rapport au point cible
            $table->string('device_id')->nullable();
            $table->text('rejection_reason')->nullable();
            $table->timestamp('validated_at')->nullable();
            $table->timestamp('rejected_at')->nullable();
            $table->timestamp('auto_validated_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('submissions');
    }
};
