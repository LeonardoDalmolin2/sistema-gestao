<?php

namespace Database\Factories;

use App\Models\Invoice;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Invoice>
 */
class InvoiceFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array 
    {
        return [
            'client_id' => fake()->numberBetween(1, 50), 
            'amount' => fake()->randomFloat(2, 50, 5000), 
            'status' => fake()->randomElement(['pending', 'paid', 'canceled']),
            'due_date' => fake()->dateTimeBetween('-1 month', '+2 months')->format('Y-m-d'),
        ];
    }
}
