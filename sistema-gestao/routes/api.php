<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ClientController;
use App\Http\Controllers\InvoiceController;

// Route::get('/user', function (Request $request) {
//     return $request->user();
// })->middleware('auth:sanctum');
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    
    // O apiResource já cria as 5 rotas (GET, POST, PUT, DELETE) automaticamente!
    Route::apiResource('clients', ClientController::class);

    Route::apiResource('invoices', InvoiceController::class);

    
});