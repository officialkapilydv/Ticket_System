<?php

namespace App\Policies;

use App\Models\Milestone;
use App\Models\Project;
use App\Models\User;

class MilestonePolicy
{
    public function create(User $user, Project $project): bool
    {
        return $user->isAdmin() || $project->owner_id === $user->id || $user->isAgent();
    }

    public function update(User $user, Milestone $milestone): bool
    {
        return $user->isAdmin()
            || $milestone->project->owner_id === $user->id
            || $user->isAgent();
    }

    public function delete(User $user, Milestone $milestone): bool
    {
        return $user->isAdmin() || $milestone->project->owner_id === $user->id;
    }
}
