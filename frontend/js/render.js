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