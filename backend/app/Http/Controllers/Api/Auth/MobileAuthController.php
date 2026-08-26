<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Spatie\Permission\Models\Role;

class MobileAuthController extends Controller
{
    /**
     * Normaliser le numéro de téléphone au format E.164 +226XXXXXXXX.
     */
    private function normalizePhoneNumber(string $phone): string
    {
        $cleaned = preg_replace('/[^\d+]/', '', $phone);
        
        if (str_starts_with($cleaned, '+226')) {
            return $cleaned;
        }
        
        if (str_starts_with($cleaned, '226')) {
            return '+' . $cleaned;
        }
        
        return '+226' . $cleaned;
    }

    /**
     * Demande d'envoi d'un code OTP.
     */
    public function requestOtp(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'phone_number' => ['required', 'string', 'regex:/^(\+226|226)?[567][0-9]{7}$/'],
        ], [
            'phone_number.required' => 'Le numéro de téléphone est obligatoire.',
            'phone_number.regex' => 'Le format du numéro de téléphone burkinabè est invalide.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Format de numéro de téléphone invalide.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $phone = $this->normalizePhoneNumber($request->input('phone_number'));
        
        // Code OTP simulé en environnement dev/test
        $otpCode = app()->environment('local', 'testing', 'dev') ? '123456' : (string) random_int(100000, 999999);

        $user = User::firstOrCreate(
            ['phone_number' => $phone],
            ['name' => 'Contributeur SapSap', 'reputation_score' => 100]
        );

        $user->forceFill([
            'otp_code' => $otpCode,
            'otp_expires_at' => now()->addMinutes(10),
        ])->save();

        return response()->json([
            'success' => true,
            'message' => 'Code OTP généré avec succès.',
            'data' => [
                'phone_number' => $phone,
            ],
            'errors' => null,
        ], 200);
    }

    /**
     * Vérification du code OTP et émission du token Sanctum.
     */
    public function verifyOtp(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'phone_number' => ['required', 'string'],
            'otp_code' => ['required', 'string', 'digits:6'],
        ], [
            'phone_number.required' => 'Le numéro de téléphone est obligatoire.',
            'otp_code.required' => 'Le code OTP est obligatoire.',
            'otp_code.digits' => 'Le code OTP doit comporter exactement 6 chiffres.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Données de validation manquantes ou invalides.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $phone = $this->normalizePhoneNumber($request->input('phone_number'));
        $inputOtp = $request->input('otp_code');

        $user = User::where('phone_number', $phone)->first();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Utilisateur introuvable avec ce numéro.',
                'errors' => null,
            ], 404);
        }

        // Mode dev/test acceptant 123456 ou correspondance avec OTP valide en base
        $isDevSimulation = app()->environment('local', 'testing', 'dev') && $inputOtp === '123456';
        $isValidOtp = ($user->otp_code === $inputOtp && $user->otp_expires_at && $user->otp_expires_at->isFuture());

        if (!$isDevSimulation && !$isValidOtp) {
            return response()->json([
                'success' => false,
                'message' => 'Code OTP invalide ou expiré.',
                'errors' => null,
            ], 400);
        }

        // Réinitialisation de l'OTP
        $user->forceFill([
            'otp_code' => null,
            'otp_expires_at' => null,
        ])->save();

        // S'assurer du rôle Spatie 'contributor'
        Role::firstOrCreate(['name' => 'contributor', 'guard_name' => 'web']);
        if (!$user->hasRole('contributor')) {
            $user->assignRole('contributor');
        }

        // Émission du token Sanctum
        $token = $user->createToken('mobile-app')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Authentification réussie.',
            'data' => [
                'token' => $token,
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'phone_number' => $user->phone_number,
                    'reputation_score' => $user->reputation_score,
                ],
            ],
            'errors' => null,
        ], 200);
    }
}
