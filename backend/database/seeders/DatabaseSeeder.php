<?php

namespace Database\Seeders;

use App\Enums\TicketPriority;
use App\Enums\TicketStatus;
use App\Enums\UserRole;
use App\Models\Category;
use App\Models\Comment;
use App\Models\Ticket;
use App\Models\TimeLog;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // ── Admin ──────────────────────────────────────────────────────
        $admin = User::create([
            'name'     => 'Admin User',
            'email'    => 'admin@ticketsystem.com',
            'password' => Hash::make('password'),
            'role'     => UserRole::Admin->value,
            'is_active'=> true,
        ]);

        // ── Agents ────────────────────────────────────────────────────
        $agent1 = User::create([
            'name'     => 'Sarah Agent',
            'email'    => 'sarah@ticketsystem.com',
            'password' => Hash::make('password'),
            'role'     => UserRole::Agent->value,
            'is_active'=> true,
        ]);

        $agent2 = User::create([
            'name'     => 'John Agent',
            'email'    => 'john@ticketsystem.com',
            'password' => Hash::make('password'),
            'role'     => UserRole::Agent->value,
            'is_active'=> true,
        ]);

        // ── Regular users ──────────────────────────────────────────────
        $users = [];
        $userNames = [
            ['Alice Johnson', 'alice@ticketsystem.com'],
            ['Bob Smith',     'bob@ticketsystem.com'],
            ['Carol White',   'carol@ticketsystem.com'],
        ];

        foreach ($userNames as [$name, $email]) {
            $users[] = User::create([
                'name'     => $name,
                'email'    => $email,
                'password' => Hash::make('password'),
                'role'     => UserRole::User->value,
                'is_active'=> true,
            ]);
        }

        // ── Categories ────────────────────────────────────────────────
        $categories = [];
        $categoryData = [
            ['name' => 'Bug', 'color' => '#ef4444', 'icon' => 'bug'],
            ['name' => 'Feature Request', 'color' => '#3b82f6', 'icon' => 'star'],
            ['name' => 'Improvement', 'color' => '#8b5cf6', 'icon' => 'trending-up'],
            ['name' => 'Documentation', 'color' => '#f59e0b', 'icon' => 'file-text'],
            ['name' => 'Support', 'color' => '#10b981', 'icon' => 'help-circle'],
        ];

        foreach ($categoryData as $cat) {
            $categories[] = Category::create([
                'name'  => $cat['name'],
                'slug'  => Str::slug($cat['name']),
                'color' => $cat['color'],
                'icon'  => $cat['icon'],
            ]);
        }

        // ── Tickets ───────────────────────────────────────────────────
        $statuses   = array_column(TicketStatus::cases(), 'value');
        $priorities = array_column(TicketPriority::cases(), 'value');
        $allUsers   = array_merge([$admin, $agent1, $agent2], $users);
        $agents     = [$agent1, $agent2, $admin];

        for ($i = 1; $i <= 30; $i++) {
            $reporter = $allUsers[array_rand($allUsers)];
            $assignee = $agents[array_rand($agents)];
            $status   = $statuses[array_rand($statuses)];
            $category = $categories[array_rand($categories)];

            $ticket = Ticket::create([
                'ulid'           => Str::ulid(),
                'title'          => "Sample Ticket #{$i}: " . fake()->sentence(4, false),
                'description'    => fake()->paragraphs(2, true),
                'status'         => $status,
                'priority'       => $priorities[array_rand($priorities)],
                'category_id'    => $category->id,
                'reporter_id'    => $reporter->id,
                'assignee_id'    => $assignee->id,
                'due_date'       => fake()->dateTimeBetween('now', '+30 days')->format('Y-m-d'),
                'estimated_hours'=> fake()->randomFloat(1, 1, 16),
                'resolved_at'    => in_array($status, ['resolved', 'closed']) ? now()->subDays(rand(1, 5)) : null,
            ]);

            // Add comments
            $commentCount = rand(1, 4);
            for ($c = 0; $c < $commentCount; $c++) {
                $commenter = $allUsers[array_rand($allUsers)];
                Comment::create([
                    'ticket_id' => $ticket->id,
                    'user_id'   => $commenter->id,
                    'body'      => fake()->paragraph(),
                ]);
            }

            // Add time logs
            $logCount = rand(1, 3);
            for ($l = 0; $l < $logCount; $l++) {
                TimeLog::create([
                    'ticket_id'   => $ticket->id,
                    'user_id'     => $assignee->id,
                    'logged_date' => fake()->dateTimeBetween('-14 days', 'now')->format('Y-m-d'),
                    'minutes'     => rand(30, 480),
                    'description' => fake()->sentence(),
                ]);
            }
        }

        $this->command->info('✓ Seeded: 1 admin, 2 agents, 3 users, 5 categories, 30 tickets');
        $this->command->info('  Login: admin@ticketsystem.com / password');
    }
}
