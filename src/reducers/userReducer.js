function userReducer (state, action) {
    const id = action.payload.id || action.payload.userId || null;
    const newUser = action.payload.user || action.payload.newUser || null;
    const newMe = action.payload.me || null;
    const newOnline = action.payload.online || false;

    const users = state.users;
    const me = state.me;

    let userIndex;

    switch (action.type) {
        case 'setOnline':
            userIndex = users.findIndex(user => user.id === id);
            users[userIndex].online = newOnline;
            return { ...state,
                users: [...users]
            }
        case 'adduser':
            return { ...state,
                users: [...users, newUser]
            };
        case 'setMe':
            return { ...state,
                me: newMe
            };
        default:
            throw new Error();
    }
};

export default userReducer;