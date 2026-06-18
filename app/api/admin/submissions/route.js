// =====================================================================
//  ADMIN API — returns all form submissions for the /panel dashboard.
//  Reads from MongoDB (data written by /api/submit).
//  Protected by ADMIN_PANEL_PASSWORD (sent as the x-admin-key header).
//
//  Required env vars (Vercel -> Settings -> Environment Variables):
//    ADMIN_PANEL_PASSWORD  — password for the /panel login
//    MONGODB_URI           — MongoDB Atlas connection string
//    MONGODB_DB            — db name (optional, default "mom")
//
//  Response shape (unchanged, so the panel UI keeps working):
//    { forms: [ { id, name, submissionCount, submissions:
//                 [ { id, created_at, data } ] } ] }
// =====================================================================
import { submissionsCollection } from "@/lib/mongo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req) {
  const pass = process.env.ADMIN_PANEL_PASSWORD;
  const key = req.headers.get("x-admin-key") || "";
  if (!pass) {
    return Response.json(
      { error: "ADMIN_PANEL_PASSWORD is not set on the server." },
      { status: 500 }
    );
  }
  if (key !== pass) {
    return Response.json({ error: "Wrong password." }, { status: 401 });
  }

  try {
    const col = await submissionsCollection();
    const grouped = await col
      .aggregate([
        { $sort: { created_at: -1 } },
        {
          $group: {
            _id: "$formName",
            submissions: {
              $push: { id: "$id", created_at: "$created_at", data: "$data" },
            },
          },
        },
        { $sort: { _id: 1 } },
      ])
      .toArray();

    const forms = grouped.map((g) => ({
      id: g._id,
      name: g._id,
      submissionCount: g.submissions.length,
      submissions: g.submissions.map((s) => ({
        id: s.id,
        created_at:
          s.created_at instanceof Date ? s.created_at.toISOString() : s.created_at,
        data: s.data || {},
      })),
    }));

    return Response.json({ forms });
  } catch (err) {
    return Response.json(
      { error: "Could not read submissions: " + err.message },
      { status: 502 }
    );
  }
}
