from fastapi import APIRouter

from app.services.supabase import get_supabase_admin

router = APIRouter()


@router.get("/tree")
async def get_crops_tree():
    """L1 > L2 > approved crops の 3 層ツリーを返す。認証不要。

    レスポンス:
    {
      "tree": [
        {
          "id": "<l1-uuid>",
          "name": "果樹類",
          "children": [
            {
              "id": "<l2-uuid>",
              "name": "かんきつ類",
              "children": [{"id": "<crop-uuid>", "name": "みかん"}]
            }
          ]
        }
      ]
    }
    """
    admin = get_supabase_admin()

    l1_res = admin.table("crop_categories_l1").select("id, name").execute()
    l2_res = (
        admin.table("crop_categories_l2")
        .select("id, name, crop_categories_l1_id")
        .execute()
    )
    crops_res = (
        admin.table("crops")
        .select("id, name, crop_categories_l2_id")
        .eq("status", "approved")
        .execute()
    )

    crops_by_l2: dict[str, list] = {}
    for c in crops_res.data or []:
        crops_by_l2.setdefault(c["crop_categories_l2_id"], []).append(
            {"id": c["id"], "name": c["name"]}
        )

    l2_by_l1: dict[str, list] = {}
    for l2 in l2_res.data or []:
        l2_by_l1.setdefault(l2["crop_categories_l1_id"], []).append(
            {
                "id": l2["id"],
                "name": l2["name"],
                "children": sorted(
                    crops_by_l2.get(l2["id"], []), key=lambda x: x["name"]
                ),
            }
        )

    tree = []
    for l1 in sorted(l1_res.data or [], key=lambda x: x["name"]):
        children = sorted(l2_by_l1.get(l1["id"], []), key=lambda x: x["name"])
        tree.append({"id": l1["id"], "name": l1["name"], "children": children})

    return {"tree": tree}
