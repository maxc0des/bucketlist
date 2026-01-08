import { toggleLike } from "./interact.js";

export async function renderPost(post) {
  const card = document.createElement("div");
  card.className = "post";
    
  const header = document.createElement("div");
  header.className = "post-header";
  header.textContent = post.username;
  card.appendChild(header);

  if (post.type === "bucket_add") {
    const p = document.createElement("p");
    p.textContent = post.content || "🆕 Bucketlist-Item hinzugefügt";
    card.appendChild(p);
  }

  else if (post.type === "bucket_done") {
    const p = document.createElement("p");
    p.textContent = post.content || "✅ Bucketlist-Item erledigt";
    card.appendChild(p);
  }

  else {
    // normaler Post
    if (post.image_paths?.length > 0) {
      for (const path of post.image_paths) {
        const { data, error } = await supabaseClient
          .storage
          .from("post-images")
          .createSignedUrl(path, 60 * 10);

        if (error) {
          console.error(error);
          continue;
        }

        const img = document.createElement("img");
        img.src = data.signedUrl;
        img.style.maxWidth = "200px";
        card.appendChild(img);
      }
    }

    if (post.content) {
      const p = document.createElement("p");
      p.textContent = post.content;
      card.appendChild(p);
    }
  }

  //like button
  const likeBtn = document.createElement("button");
  likeBtn.className = "like-btn";
  likeBtn.dataset.postId = post.id;
  likeBtn.innerHTML = `❤️ <span class="like-count">${post.like_count || 0}</span>`;
  likeBtn.onclick = async (e) => {
    if (!e.target.closest(".like-btn")) return;
      const btn = e.target.closest(".like-btn");
      const postId = btn.dataset.postId;

      const {
        data: { user },
      } = await supabaseClient.auth.getUser();

      if (!user) return alert("Bitte einloggen");

      const liked = await toggleLike(postId, user.id);

      btn.classList.toggle("liked", liked);

      // update like count UI
      const countSpan = btn.querySelector(".like-count");
      if (countSpan) {
        const current = parseInt(countSpan.textContent || "0", 10);
        countSpan.textContent = String(liked ? current + 1 : Math.max(0, current - 1));
      }
  };
  card.appendChild(likeBtn);

  return card;
}

export async function renderFeed(posts) {
  const feed = document.getElementById("feed");
  if (!feed) return;

  feed.innerHTML = "";

  for (const post of posts) {
    const card = await renderPost(post);
    feed.appendChild(card);

    // Add separator line after each card
    const separator = document.createElement("hr");
    separator.style.border = "none";
    separator.style.borderTop = "1px solid #ddd";
    separator.style.margin = "10px 0";
    feed.appendChild(separator);
  }
}