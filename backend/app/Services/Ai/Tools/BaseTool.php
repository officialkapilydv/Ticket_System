<?php

namespace App\Services\Ai\Tools;

use App\Models\User;

abstract class BaseTool
{
    public string $name;

    abstract public function definition(): array;

    abstract public function execute(array $input, User $user): array;
}
