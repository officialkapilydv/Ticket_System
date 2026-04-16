<?php

use App\Http\Controllers\Api\Admin\DashboardController;
use App\Http\Controllers\Api\Admin\UserController;
use App\Http\Controllers\Api\AiChatController;
use App\Http\Controllers\Api\UserDashboardController;
use App\Http\Controllers\Api\AttachmentController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\TaskController;
use App\Http\Controllers\Api\TaskCommentController;
use App\Http\Controllers\Api\LabelController;
use App\Http\Controllers\Api\MilestoneController;
use App\Http\Controllers\Api\PartnerController;
use App\Http\Controllers\Api\ProjectController;
use App\Http\Controllers\Api\Auth\LoginController;
use App\Http\Controllers\Api\Auth\ProfileController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\CommentController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\TicketController;
use App\Http\Controllers\Api\TimeLogController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes — v1
|--------------------------------------------------------------------------
*/

Route::prefix('v1')->group(function () {

    // ── Auth (public) ──────────────────────────────────────────────────
    Route::prefix('auth')->middleware('throttle:login')->group(function () {
        Route::post('/login', [LoginController::class, 'login']);
    });

    // ── Authenticated routes ───────────────────────────────────────────
    Route::middleware(['auth:sanctum', 'ensure.active'])->group(function () {

        // Auth
        Route::prefix('auth')->group(function () {
            Route::post('/logout', [LoginController::class, 'logout']);
            Route::get('/me', [LoginController::class, 'me']);
            Route::put('/profile', [ProfileController::class, 'update']);
            Route::put('/password', [ProfileController::class, 'changePassword']);
        });

        // Projects (readable by all authenticated users)
        Route::get('/projects', [ProjectController::class, 'index']);
        Route::post('/projects', [ProjectController::class, 'store']);
        Route::get('/projects/{project}', [ProjectController::class, 'show']);
        Route::put('/projects/{project}', [ProjectController::class, 'update']);
        Route::delete('/projects/{project}', [ProjectController::class, 'destroy']);

        // Milestones (nested under projects)
        Route::get('/projects/{project}/milestones', [MilestoneController::class, 'index']);
        Route::post('/projects/{project}/milestones', [MilestoneController::class, 'store']);
        Route::put('/projects/{project}/milestones/{milestone}', [MilestoneController::class, 'update']);
        Route::delete('/projects/{project}/milestones/{milestone}', [MilestoneController::class, 'destroy']);

        // Types (categories)
        Route::get('/types', [CategoryController::class, 'index']);

        // Labels (readable by all authenticated users)
        Route::get('/labels', [LabelController::class, 'index']);

        // Partners (readable by all authenticated users)
        Route::get('/partners', [PartnerController::class, 'index']);

        // Users (for assignee dropdown — all authenticated)
        Route::get('/users', [UserController::class, 'index']);
        Route::get('/users/agents', [UserController::class, 'agents']);

        // Tasks
        Route::get('/tasks', [TaskController::class, 'index']);
        Route::post('/tasks', [TaskController::class, 'store']);
        Route::get('/tasks/{task:ulid}', [TaskController::class, 'show']);
        Route::put('/tasks/{task:ulid}', [TaskController::class, 'update']);
        Route::delete('/tasks/{task:ulid}', [TaskController::class, 'destroy']);
        Route::post('/tasks/{task:ulid}/assign', [TaskController::class, 'assign']);
        Route::patch('/tasks/{task:ulid}/status', [TaskController::class, 'changeStatus']);

        // Task Comments
        Route::get('/tasks/{task:ulid}/comments', [TaskCommentController::class, 'index']);
        Route::post('/tasks/{task:ulid}/comments', [TaskCommentController::class, 'store']);
        Route::put('/tasks/{task:ulid}/comments/{comment}', [TaskCommentController::class, 'update']);
        Route::delete('/tasks/{task:ulid}/comments/{comment}', [TaskCommentController::class, 'destroy']);

        // Tickets
        Route::get('/tickets', [TicketController::class, 'index']);
        Route::post('/tickets', [TicketController::class, 'store']);
        Route::get('/tickets/{ticket:ulid}', [TicketController::class, 'show']);
        Route::put('/tickets/{ticket:ulid}', [TicketController::class, 'update']);
        Route::delete('/tickets/{ticket:ulid}', [TicketController::class, 'destroy']);
        Route::get('/tickets/{ticket:ulid}/history', [TicketController::class, 'history']);
        Route::post('/tickets/{ticket:ulid}/assign', [TicketController::class, 'assign']);
        Route::patch('/tickets/{ticket:ulid}/status', [TicketController::class, 'changeStatus']);

        // Comments
        Route::get('/tickets/{ticket:ulid}/comments', [CommentController::class, 'index']);
        Route::post('/tickets/{ticket:ulid}/comments', [CommentController::class, 'store']);
        Route::put('/tickets/{ticket:ulid}/comments/{comment}', [CommentController::class, 'update']);
        Route::delete('/tickets/{ticket:ulid}/comments/{comment}', [CommentController::class, 'destroy']);

        // Attachments
        Route::post('/tickets/{ticket:ulid}/attachments', [AttachmentController::class, 'store']);
        Route::delete('/tickets/{ticket:ulid}/attachments/{attachment}', [AttachmentController::class, 'destroy']);
        Route::get('/tickets/{ticket:ulid}/attachments/{attachment}/download', [AttachmentController::class, 'download']);

        // Time Logs
        Route::get('/tickets/{ticket:ulid}/time-logs', [TimeLogController::class, 'index']);
        Route::post('/tickets/{ticket:ulid}/time-logs', [TimeLogController::class, 'store']);
        Route::put('/tickets/{ticket:ulid}/time-logs/{timeLog}', [TimeLogController::class, 'update']);
        Route::delete('/tickets/{ticket:ulid}/time-logs/{timeLog}', [TimeLogController::class, 'destroy']);
        Route::get('/time-logs/report', [TimeLogController::class, 'myReport']);
        Route::get('/time-logs/full-report', [TimeLogController::class, 'fullReport']);

        // Reports (accessible by all authenticated users)
        Route::prefix('reports')->group(function () {
            Route::get('/projects', [ReportController::class, 'projects']);
            Route::get('/tasks',    [ReportController::class, 'tasks']);
            Route::get('/tickets',  [ReportController::class, 'tickets']);
        });

        // AI Assistant
        Route::prefix('ai')->middleware('throttle:30,1')->group(function () {
            Route::post('/chat', [AiChatController::class, 'chat']);
            Route::get('/conversations', [AiChatController::class, 'conversations']);
        });

        // User dashboard
        Route::get('/dashboard/my-summary', [UserDashboardController::class, 'summary']);

        // Notifications
        Route::get('/notifications', [NotificationController::class, 'index']);
        Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount']);
        Route::post('/notifications/read-all', [NotificationController::class, 'markAllAsRead']);
        Route::patch('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);

        // ── Admin-only routes ──────────────────────────────────────────
        Route::middleware('admin')->prefix('admin')->group(function () {

            // Dashboard
            Route::get('/dashboard/summary', [DashboardController::class, 'summary']);
            Route::get('/dashboard/time-report', [DashboardController::class, 'timeReport']);
            Route::get('/dashboard/ticket-stats', [DashboardController::class, 'ticketStats']);

            // User management
            Route::post('/users', [UserController::class, 'store']);
            Route::get('/users/{user}/profile', [UserController::class, 'profile']);
            Route::put('/users/{user}', [UserController::class, 'update']);
            Route::patch('/users/{user}/deactivate', [UserController::class, 'deactivate']);

            // Types management
            Route::post('/types', [CategoryController::class, 'store']);
            Route::delete('/types/{category}', [CategoryController::class, 'destroy']);

            // Labels management
            Route::post('/labels', [LabelController::class, 'store']);
            Route::put('/labels/{label}', [LabelController::class, 'update']);
            Route::delete('/labels/{label}', [LabelController::class, 'destroy']);

            // Partners management
            Route::post('/partners', [PartnerController::class, 'store']);
            Route::put('/partners/{partner}', [PartnerController::class, 'update']);
            Route::delete('/partners/{partner}', [PartnerController::class, 'destroy']);
        });
    });
});
