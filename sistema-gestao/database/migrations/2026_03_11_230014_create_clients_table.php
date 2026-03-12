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
    Schema::create('clients', function (Blueprint $table) {
        $table->id();
        // A chave estrangeira ligando o cliente ao usuário que o cadastrou
        $table->foreignId('user_id')->constrained()->onDelete('cascade');
        
        $table->string('name', 100);
        $table->string('email', 100);
        $table->string('cellphone', 20); // 20 para evitar problemas com formatação
        $table->timestamps();
    });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('clients');
    }
};
