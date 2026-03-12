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
    public function index()
    {
        $userId = Auth::id(); 
        
        $clients = Client::where('user_id', $userId)->pluck('id');

        $invoices = Invoice::whereIn('client_id', $clients)->get();

        return response()->json($invoices, 200);
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
