import os
from typing import Optional

import vtracer
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response

app = FastAPI(title="Vectorization Tool API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ENGINE_PRESETS = {
    "metal": {
        "colormode": "color",
        "hierarchical": "cutout",
        "mode": "spline",
        "filter_speckle": 4,
        "color_precision": 8,
        "layer_difference": 16,
        "corner_threshold": 20,
        "length_threshold": 10.0,
        "max_iterations": 10,
        "splice_threshold": 45,
        "path_precision": 10,
    },
    "anime": {
        "colormode": "color",
        "hierarchical": "stacked",
        "mode": "spline",
        "filter_speckle": 4,
        "color_precision": 8,
        "layer_difference": 16,
        "corner_threshold": 60,
        "length_threshold": 4.0,
        "max_iterations": 10,
        "splice_threshold": 45,
        "path_precision": 8,
    },
    "logo": {
        "colormode": "color",
        "hierarchical": "cutout",
        "mode": "polygon",
        "filter_speckle": 8,
        "color_precision": 6,
        "layer_difference": 16,
        "corner_threshold": 60,
        "length_threshold": 10.0,
        "max_iterations": 10,
        "splice_threshold": 45,
        "path_precision": 3,
    },
}


@app.post("/vectorize")
async def vectorize(
    file: UploadFile = File(...),
    engine: str = Form("metal"),
    # Manual overrides (None = use preset)
    detail_level: Optional[int] = Form(None),   # maps to path_precision (1-10)
    color_count: Optional[int] = Form(None),    # maps to color_precision (2-32)
    corner_sharpness: Optional[int] = Form(None),  # maps to corner_threshold (1-180)
):
    if engine not in ENGINE_PRESETS:
        raise HTTPException(status_code=400, detail=f"Unknown engine: {engine}. Choose from: metal, anime, logo")

    if file.content_type not in ("image/png", "image/jpeg", "image/webp"):
        raise HTTPException(status_code=400, detail="Only PNG, JPEG, and WebP images are supported")

    image_bytes = await file.read()

    params = ENGINE_PRESETS[engine].copy()

    # Apply manual overrides
    if detail_level is not None:
        clamped = max(1, min(10, detail_level))
        params["path_precision"] = clamped
        # Invert: higher detail_level = lower length_threshold
        params["length_threshold"] = round(11.0 - clamped, 1)

    if color_count is not None:
        params["color_precision"] = max(2, min(32, color_count))

    if corner_sharpness is not None:
        # Invert: higher sharpness = lower corner_threshold (sharper corners kept)
        params["corner_threshold"] = max(1, min(180, 181 - corner_sharpness))

    # Determine image format from content type
    fmt_map = {"image/png": "png", "image/jpeg": "jpg", "image/webp": "webp"}
    img_format = fmt_map.get(file.content_type, "png")

    svg_content = vtracer.convert_raw_image_to_svg(
        image_bytes,
        img_format=img_format,
        colormode=params["colormode"],
        hierarchical=params["hierarchical"],
        mode=params["mode"],
        filter_speckle=params["filter_speckle"],
        color_precision=params["color_precision"],
        layer_difference=params["layer_difference"],
        corner_threshold=params["corner_threshold"],
        length_threshold=params["length_threshold"],
        max_iterations=params["max_iterations"],
        splice_threshold=params["splice_threshold"],
        path_precision=params["path_precision"],
    )

    return Response(
        content=svg_content,
        media_type="image/svg+xml",
        headers={"Content-Disposition": f'attachment; filename="output_{engine}.svg"'},
    )


@app.get("/engines")
def get_engines():
    return {
        "engines": [
            {
                "id": "metal",
                "name": "Metal Engine",
                "description": "High-detail monochrome. Ideal for metal art with sharp spikes and fine lines.",
                "badge": "Color · Spline · Ultra-Detail",
            },
            {
                "id": "anime",
                "name": "Anime Engine",
                "description": "Color gradients with hierarchical stacking. Perfect for cel-shading and DTF printing.",
                "badge": "Color · Stacked · Gradients",
            },
            {
                "id": "logo",
                "name": "Logo Engine",
                "description": "Simplified polygon paths optimized for vinyl cutting plotters.",
                "badge": "Polygon · Low-Node · Vinyl",
            },
        ]
    }


@app.get("/health")
def health():
    return {"status": "ok"}
