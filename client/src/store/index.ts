import { configureStore } from "@reduxjs/toolkit"

import activitiesReducer from "./activitiesSlice"
import authReducer from "./authSlice"
import automationsReducer from "./automationsSlice"
import campaignsReducer from "./campaignsSlice"
import companiesReducer from "./companiesSlice"
import contactsReducer from "./contactsSlice"
import conversationsReducer from "./conversationsSlice"
import documentsReducer from "./documentsSlice"
import emailReducer from "./emailSlice"
import leadsReducer from "./leadsSlice"
import dealsReducer from "./dealsSlice"
import tasksReducer from "./tasksSlice"
import usersReducer from "./usersSlice"
import notificationsReducer from "./notificationsSlice"

export const store = configureStore({
  reducer: {
    auth: authReducer,
    users: usersReducer,
    contacts: contactsReducer,
    companies: companiesReducer,
    leads: leadsReducer,
    activities: activitiesReducer,
    conversations: conversationsReducer,
    deals: dealsReducer,
    tasks: tasksReducer,
    email: emailReducer,
    documents: documentsReducer,
    campaigns: campaignsReducer,
    automations: automationsReducer,
    notifications: notificationsReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
