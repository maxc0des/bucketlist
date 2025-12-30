async function getIdbyUsername(username) {
    const { data, error } = await supabaseClient
        .from("profiles")
        .select("id")
        .eq("username", username.trim());

    if (error) return console.error(error);
    return data && data.length > 0 ? data[0].id : null;
}

async function addFriend() {
    const friendUsername = document.getElementById("friend-username").value;
    const friendId = await getIdbyUsername(friendUsername);
    if (!friendId) {
        alert("Friend not found.");
        return;
    }

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError) return console.error(userError);

    const { error } = await supabaseClient
        .from("friends")
        .insert({ user_id: user.id, friend_id: friendId });

    if (error) return console.error(error);
    alert("Friend added!");
}