<?php

use App\Http\Controllers\Api\Admin\DashboardController;
use App\Http\Controllers\Api\Admin\UserController;
use App\Http\Controllers\Api\AttachmentController;
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

        // Categories
        Route::get('/categories', [CategoryController::class, 'index']);

        // Users (for assignee dropdown — all authenticated)
        Route::get('/users', [UserController::class, 'index']);
        Route::get('/users/agents', [UserController::class, 'agents']);

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

            // Categories management
            Route::post('/categories', [CategoryController::class, 'store']);
            Route::delete('/categories/{category}', [CategoryController::class, 'destroy']);
        });
    });
});
