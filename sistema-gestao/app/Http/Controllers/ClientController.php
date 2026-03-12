<?php

namespace App\Http\Controllers;

use App\Models\Client;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ClientController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {

        $userId = Auth::id(); 
        
        $clients = Client::where('user_id', $userId)->get();

        return response()->json($clients, 200);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        // Valida se os dados vieram certinhos do frontend/Insomnia
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'email' => 'required|email|max:100',
            'cellphone' => 'required|string|max:20'
        ]);

        // Adicionamos o ID do usuário que está logado no pacote de dados
        $validated['user_id'] = Auth::id();

        // Em vez de "INSERT INTO...", o Laravel faz a mágica:
        $client = Client::create($validated);

        return response()->json([
            'message' => 'Cliente cadastrado com sucesso!',
            'client' => $client
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        // 1. Busca o cliente no banco pelo ID que vem na URL (ex: /api/clients/5)
        $client = Client::find($id);

        // 2. Se o cliente não existir, devolvemos um erro 404 (Not Found)
        if (!$client) {
            return response()->json(['message' => 'Cliente não encontrado.'], 404);
        }

        // 3. Trava de Segurança: Esse cliente pertence a quem está logado?
        if ($client->user_id !== Auth::id()) {
            return response()->json(['message' => 'Acesso negado. Este cliente não é seu.'], 403);
        }

        // 4. Valida se o frontend mandou os dados certinhos (igual no create)
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'email' => 'required|email|max:100',
            'cellphone' => 'required|string|max:20'
        ]);

        // 5. Em vez de "UPDATE clients SET...", o Laravel faz a mágica:
        $client->update($validated);

        return response()->json([
            'message' => 'Cliente atualizado com sucesso!',
            'client' => $client
        ], 200);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        // 1. Busca o cliente no banco
        $client = Client::find($id);

        // 2. Se não existir, erro 404
        if (!$client) {
            return response()->json(['message' => 'Cliente não encontrado.'], 404);
        }

        // 3. Trava de Segurança
        if ($client->user_id !== Auth::id()) {
            return response()->json(['message' => 'Acesso negado. Este cliente não é seu.'], 403);
        }

        // 4. A ordem de execução (sem $request!)
        $client->delete();

        // 5. O aviso de sucesso pro frontend
        return response()->json(['message' => 'Cliente excluído com sucesso!'], 200);
    }
}
