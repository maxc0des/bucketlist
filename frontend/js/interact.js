export async function toggleLike(postId, userId) {
  // prüfen ob Like existiert
  if (!userId) {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) throw new Error("No authenticated user");
    userId = user.id;
  }
  const { data: existing, error } = await supabaseClient
    .from("post_likes")
    .select("id")
    .eq("post_id", postId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("Error checking existing like:", error);
    throw error;
  }

  if (existing) {
    // unlike
    // try delete by id if available, otherwise by post_id+user_id
    const delQuery = supabaseClient.from("post_likes").delete();
    if (existing.id) {
      await delQuery.eq("id", existing.id);
    } else {
      await delQuery.eq("post_id", postId).eq("user_id", userId);
    }

    return false;
  } else {
    // like
    await supabaseClient
      .from("post_likes")
      .insert({ post_id: postId, user_id: userId, created_at: new Date().toISOString() });

    return true;
  }
}