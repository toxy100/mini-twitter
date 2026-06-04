const SUPABASE_URL = "https://mqfszvhpnpqrbxjbtwey.supabase.co";
const SUPABASE_KEY = "sb_publishable_8xWN6nmUtPConHDBBb783g_l0qJSCSX";
const CLASS_CODE = "2026-final";

const postsEl = document.querySelector("#posts");
const statusEl = document.querySelector("#status");
let supabaseClient;

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

function getSupabaseClient() {
  if (typeof supabase === "undefined") {
    throw new Error("The Supabase library did not load.");
  }

  if (!supabaseClient) {
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  }

  return supabaseClient;
}

function renderPost(post, isNew = false) {
  const card = document.createElement("article");
  card.className = `post-card${isNew ? " is-new" : ""}`;

  if (post.id) {
    card.dataset.postId = post.id;
  }

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
    const client = getSupabaseClient();
    const { data, error } = await client
      .from("posts")
      .select("id, author, body, created_at")
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
    postsEl.append(...data.map((post) => renderPost(post)));
  } catch (error) {
    setStatus(
      `Could not load posts yet. Please check the Supabase table or permissions. Error: ${error.message}`,
      "error",
    );
  }
}

function addPostToTop(post) {
  const alreadyRendered =
    post.id &&
    Array.from(postsEl.children).some((card) => card.dataset.postId === post.id);

  if (alreadyRendered) {
    return;
  }

  setStatus("");
  postsEl.prepend(renderPost(post, true));

  while (postsEl.children.length > 30) {
    postsEl.lastElementChild.remove();
  }
}

function subscribeToNewPosts() {
  try {
    const client = getSupabaseClient();

    client
      .channel("new-posts-2026-final")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "posts",
          filter: `class_code=eq.${CLASS_CODE}`,
        },
        (payload) => {
          addPostToTop(payload.new);
        },
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR") {
          setStatus(
            "Realtime updates are unavailable right now. The latest loaded posts are still shown.",
            "error",
          );
        }
      });
  } catch (error) {
    setStatus(
      `Could not start realtime updates. Error: ${error.message}`,
      "error",
    );
  }
}

loadPosts();
subscribeToNewPosts();
