<?php

namespace App\Providers;

use App\Events\CommentPosted;
use App\Events\TicketAssigned;
use App\Events\TicketCreated;
use App\Events\TicketStatusChanged;
use App\Events\TicketUpdated;
use App\Listeners\NotifyMentionedUsers;
use App\Listeners\SendSlackNotification;
use App\Listeners\SendTicketAssignedNotification;
use App\Models\Comment;
use App\Models\Milestone;
use App\Models\Project;
use App\Models\Ticket;
use App\Policies\CommentPolicy;
use App\Policies\MilestonePolicy;
use App\Policies\ProjectPolicy;
use App\Policies\TicketPolicy;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        // Policies
        Gate::policy(Ticket::class, TicketPolicy::class);
        Gate::policy(Comment::class, CommentPolicy::class);
        Gate::policy(Project::class, ProjectPolicy::class);
        Gate::policy(Milestone::class, MilestonePolicy::class);

        // Events → Listeners
        Event::listen(TicketCreated::class, SendSlackNotification::class);
        Event::listen(TicketStatusChanged::class, SendSlackNotification::class);
        Event::listen(TicketAssigned::class, SendTicketAssignedNotification::class);
        Event::listen(CommentPosted::class, NotifyMentionedUsers::class);

        // Rate limiting
        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(120)->by($request->user()?->id ?: $request->ip());
        });

        RateLimiter::for('login', function (Request $request) {
            return Limit::perMinute(10)->by($request->ip());
        });
    }
}
