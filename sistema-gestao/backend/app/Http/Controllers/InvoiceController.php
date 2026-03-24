<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\Invoice;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;


class InvoiceController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $userId = Auth::id();

        $query = Invoice::with('client:id,name')->whereHas('client', function ($q) use ($userId) {
            $q->where('user_id', $userId);
        });

        if ($request->filled('client_id')) {
            $clientId = (int) $request->query('client_id');

            $clienteEhDoUsuario = \App\Models\Client::where('id', $clientId)
                ->where('user_id', $userId)
                ->exists();

            if (! $clienteEhDoUsuario) {
                return response()->json(['message' => 'Cliente não encontrado ou acesso negado.'], 403);
            }

            $query->where('client_id', $clientId);
        }

        return response()->json($query->paginate(10), 200);
    }
    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'client_id' => 'required|integer|exists:clients,id',
            'amount'    => 'required|numeric|min:0',
            'status'    => 'required|in:pending,paid,canceled',
            'due_date'  => 'required|date'
        ]);

        $client = Client::find($request->client_id);

        if ($client->user_id !== Auth::id()) {
            return response()->json(['message' => 'Acesso negado. Este cliente não pertence a você.'], 403);
        }

        $invoice = Invoice::create($validated);

        return response()->json([
            'message' => 'Fatura cadastrada com sucesso!',
            'invoice' => $invoice
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $invoice = Invoice::find($id);

        if (!$invoice) {
            return response()->json(['message' => 'Fatura não encontrada.'], 404);
        }

        $client = Client::find($invoice->client_id);

        if ($client->user_id !== Auth::id()) {
            return response()->json(['message' => 'Acesso negado. Esta fatura não pertence a um cliente seu.'], 403);
        }

        return response()->json($invoice, 200);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $invoice = Invoice::find($id);

        if (!$invoice) {
            return response()->json(['message' => 'Fatura não encontrada.'], 404);
        }

        $client = Client::find($invoice->client_id);

        if ($client->user_id !== Auth::id()) {
            return response()->json(['message' => 'Acesso negado. Esta fatura não pertence a você.'], 403);
        }

        $validated = $request->validate([
            'client_id' => 'required|integer|exists:clients,id',
            'amount'    => 'required|numeric|min:0',
            'status'    => 'required|in:pending,paid,canceled',
            'due_date'  => 'required|date'
        ]);

        if ($request->client_id != $invoice->client_id) {
            $novoCliente = Client::find($request->client_id);
            if ($novoCliente->user_id !== Auth::id()) {
                return response()->json(['message' => 'Acesso negado. O novo cliente informado não é seu.'], 403);
            }
        }

        $invoice->update($validated);

        return response()->json([
            'message' => 'Fatura atualizada com sucesso!',
            'invoice' => $invoice
        ], 200);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $invoice = Invoice::find($id);

        if (!$invoice) {
            return response()->json(['message' => 'Fatura não encontrada.'], 404);
        }

        $client = Client::find($invoice->client_id);

        if ($client->user_id !== Auth::id()) {
            return response()->json(['message' => 'Acesso negado. Esta fatura não é sua.'], 403);
        }

        $invoice->delete();

        return response()->json(['message' => 'Fatura excluída com sucesso!'], 200);
    }
}
