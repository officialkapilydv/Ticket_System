<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Partner;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PartnerController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(Partner::orderBy('name')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name'    => ['required', 'string', 'max:150'],
            'email'   => ['nullable', 'email', 'max:150'],
            'phone'   => ['nullable', 'string', 'max:50'],
            'company' => ['nullable', 'string', 'max:150'],
            'website' => ['nullable', 'url', 'max:255'],
        ]);

        $partner = Partner::create($request->only(['name', 'email', 'phone', 'company', 'website']));

        return response()->json($partner, 201);
    }

    public function update(Request $request, Partner $partner): JsonResponse
    {
        $request->validate([
            'name'    => ['sometimes', 'string', 'max:150'],
            'email'   => ['nullable', 'email', 'max:150'],
            'phone'   => ['nullable', 'string', 'max:50'],
            'company' => ['nullable', 'string', 'max:150'],
            'website' => ['nullable', 'url', 'max:255'],
        ]);

        $partner->update($request->only(['name', 'email', 'phone', 'company', 'website']));

        return response()->json($partner->fresh());
    }

    public function destroy(Partner $partner): JsonResponse
    {
        $partner->delete();
        return response()->json(['message' => 'Partner deleted.']);
    }
}