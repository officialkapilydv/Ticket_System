<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Label;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class LabelController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(Label::orderBy('name')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name'  => ['required', 'string', 'max:100', 'unique:labels,name'],
            'color' => ['nullable', 'string', 'regex:/^#[0-9a-fA-F]{6}$/'],
        ]);

        $label = Label::create([
            'name'  => $request->name,
            'slug'  => Str::slug($request->name),
            'color' => $request->color ?? '#6366f1',
        ]);

        return response()->json($label, 201);
    }

    public function update(Request $request, Label $label): JsonResponse
    {
        $request->validate([
            'name'  => ['sometimes', 'string', 'max:100', 'unique:labels,name,' . $label->id],
            'color' => ['nullable', 'string', 'regex:/^#[0-9a-fA-F]{6}$/'],
        ]);

        $data = $request->only(['color']);
        if ($request->has('name')) {
            $data['name'] = $request->name;
            $data['slug'] = Str::slug($request->name);
        }

        $label->update($data);

        return response()->json($label->fresh());
    }

    public function destroy(Label $label): JsonResponse
    {
        // Tickets using this label will have label_id set to null (nullOnDelete)
        $label->delete();
        return response()->json(['message' => 'Label deleted.']);
    }
}
