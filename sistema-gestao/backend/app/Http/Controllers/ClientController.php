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
        
        $clients = \App\Models\Client::paginate(10);
        
        return response()->json($clients, 200);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'email' => 'required|email|max:100',
            'phone' => 'required|string|max:20'
        ]);

        $validated['user_id'] = Auth::id();

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
        $client = \App\Models\Client::findOrFail($id);
        return response()->json($client);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $client = Client::find($id);

        if (!$client) {
            return response()->json(['message' => 'Cliente não encontrado.'], 404);
        }

        if ($client->user_id !== Auth::id()) {
            return response()->json(['message' => 'Acesso negado. Este cliente não é seu.'], 403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'email' => 'required|email|max:100',
            'phone' => 'required|string|max:20'
        ]);

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
        $client = Client::find($id);

        if (!$client) {
            return response()->json(['message' => 'Cliente não encontrado.'], 404);
        }

        if ($client->user_id !== Auth::id()) {
            return response()->json(['message' => 'Acesso negado. Este cliente não é seu.'], 403);
        }

        $client->delete();

        return response()->json(['message' => 'Cliente excluído com sucesso!'], 200);
    }
}
