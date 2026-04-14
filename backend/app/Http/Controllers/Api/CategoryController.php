<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CategoryController extends Controller
{
    public function index(): JsonResponse
    {
        $categories = Category::with('children')->whereNull('parent_id')->get();
        return response()->json($categories);
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorize('create', Category::class);

        $request->validate([
            'name'        => ['required', 'string', 'max:100'],
            'color'       => ['nullable', 'string', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'icon'        => ['nullable', 'string', 'max:50'],
            'description' => ['nullable', 'string'],
            'parent_id'   => ['nullable', 'exists:categories,id'],
        ]);

        $category = Category::create([
            ...$request->only(['name', 'color', 'icon', 'description', 'parent_id']),
            'slug' => Str::slug($request->name),
        ]);

        return response()->json($category, 201);
    }

    public function destroy(Category $category): JsonResponse
    {
        $this->authorize('delete', Category::class);
        $category->delete();
        return response()->json(['message' => 'Category deleted.']);
    }
}
