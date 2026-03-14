<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        // 1. Valida se o frontend mandou email e senha
        $credentials = $request->validate([
            'email' => 'required|email',
            'password' => 'required'
        ]);

        // 2. Tenta fazer o login no banco de dados
        if (Auth::attempt($credentials)) {
            $user = Auth::user();
            
            // 3. Cria o token de acesso para a API usando o Sanctum
            $token = $user->createToken('token-gestao')->plainTextToken;

            // 4. Devolve o JSON de sucesso com a "pulseira"
            return response()->json([
                'message' => 'Login realizado com sucesso!',
                'token' => $token,
                'user' => $user
            ], 200);
        }

        // 5. Se a senha estiver errada, devolve erro 401 (Não Autorizado)
        return response()->json([
            'message' => 'E-mail ou senha incorretos.'
        ], 401);
    }
}