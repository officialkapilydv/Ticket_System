<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Partner extends Model
{
    protected $fillable = ['name', 'email', 'phone', 'company', 'website'];

    public function tickets(): HasMany
    {
        return $this->hasMany(Ticket::class);
    }
}