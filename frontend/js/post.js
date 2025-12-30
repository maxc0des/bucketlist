async function uploadPostImages(files, postId, userId) {
  const paths = [];

  for (const file of files) {
    const filePath = `${userId}/${postId}/${crypto.randomUUID()}-${file.name}`;

    const { error } = await supabaseClient
      .storage
      .from("post-images")
      .upload(filePath, file);

    if (error) {
      console.error(error);
      continue;
    }

    paths.push(filePath);
  }
  console.log("IMAGE PATHS:", paths);

  return paths;
}

async function createPostWithImages(bucketItemId, text, files) {
  console.log("FILES:", files, files?.length);
  const { data: { user } } = await supabaseClient.auth.getUser();

  // 1️⃣ Post ohne Bilder anlegen
  const { data: post, error } = await supabaseClient
    .from("posts")
    .insert({
      user_id: user.id,
      bucket_item_id: bucketItemId,
      content: text,
      image_paths: []
    })
    .select()
    .single();

  if (error) return console.error(error);

  // 2️⃣ Bilder hochladen
  const imagePaths = await uploadPostImages(files, post.id, user.id);

  // 3️⃣ Post updaten
  await supabaseClient
    .from("posts")
    .update({ image_paths: imagePaths })
    .eq("id", post.id);

  return post;  // Gib den Post zurück, um die ID zu verwenden
}

async function post() {
  const captionEl = document.getElementById("caption");
  const fileEl = document.getElementById("images");

  const text = captionEl.value;
  const files = fileEl.files;

  const params = new URLSearchParams(window.location.search);
  const bucketItemId = params.get("id");

  if (!bucketItemId || text.length === 0 || files.length === 0) {
    alert("fehlendes parameter");
    return;
  }

  // Erstelle Post und hole die ID
  const post = await createPostWithImages(bucketItemId, text, files);

  // Dann complete das Item mit der Post-ID
  await completeBucketItem(bucketItemId, post.id);

  window.location.href = 'bucketlist.html';
}

async function completeBucketItem(bucketItemId, postId) {
  const { error } = await supabaseClient
    .from("bucket_items")
    .update({
      completed: true,
      completed_at: new Date().toISOString(),
      post_id: postId  // Post-ID speichern
    })
    .eq("id", bucketItemId);

  if (error) {
    console.error(error);
    alert("Konnte Item nicht abhaken");
    return;
  }
}