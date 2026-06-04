const SUPABASE_URL = "https://mqfszvhpnpqrbxjbtwey.supabase.co";
const SUPABASE_KEY = "sb_publishable_8xWN6nmUtPConHDBBb783g_l0qJSCSX";
const CLASS_CODE = "2026-final";

const postsEl = document.querySelector("#posts");
const statusEl = document.querySelector("#status");

function setStatus(message, type = "info") {
  statusEl.textContent = message;
  statusEl.classList.toggle("error", type === "error");
}

function friendlyTime(value) {
  if (!value) return "Unknown time";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown time";

  const secondsAgo = Math.round((Date.now() - date.getTime()) / 1000);
  const units = [
    ["year", 60 * 60 * 24 * 365],
    ["month", 60 * 60 * 24 * 30],
    ["day", 60 * 60 * 24],
    ["hour", 60 * 60],
    ["minute", 60],
  ];

  if (secondsAgo < 60) return "Just now";

  for (const [unit, secondsInUnit] of units) {
    const amount = Math.floor(secondsAgo / secondsInUnit);
    if (amount >= 1) {
      return `${amount} ${unit}${amount === 1 ? "" : "s"} ago`;
    }
  }

  return date.toLocaleDateString();
}

function renderPost(post) {
  const card = document.createElement("article");
  card.className = "post-card";

  const meta = document.createElement("div");
  meta.className = "post-meta";

  const author = document.createElement("span");
  author.className = "author";
  author.textContent = post.author || "Anonymous";

  const time = document.createElement("time");
  time.className = "time";
  time.dateTime = post.created_at || "";
  time.textContent = friendlyTime(post.created_at);

  const body = document.createElement("p");
  body.className = "body";
  body.textContent = post.body || "";

  meta.append(author, time);
  card.append(meta, body);

  return card;
}

async function loadPosts() {
  setStatus("Loading posts...");

  try {
    if (typeof supabase === "undefined") {
      throw new Error("The Supabase library did not load.");
    }

    const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    const { data, error } = await supabaseClient
      .from("posts")
      .select("author, body, created_at")
      .eq("class_code", CLASS_CODE)
      .order("created_at", { ascending: false })
      .limit(30);

    if (error) {
      throw error;
    }

    postsEl.innerHTML = "";

    if (!data || data.length === 0) {
      setStatus("No posts are showing yet. Check back soon!");
      return;
    }

    setStatus("");
    postsEl.append(...data.map(renderPost));
  } catch (error) {
    setStatus(
      `Could not load posts yet. Please check the Supabase table or permissions. Error: ${error.message}`,
      "error",
    );
  }
}

loadPosts();
