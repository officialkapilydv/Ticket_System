<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Label extends Model
{
    protected $fillable = ['name', 'slug', 'color'];

    public function tickets(): HasMany
    {
        return $this->hasMany(Ticket::class);
    }
}
