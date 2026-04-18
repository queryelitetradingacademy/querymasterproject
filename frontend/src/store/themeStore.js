import { create } from 'zustand'

const useThemeStore = create((set) => ({
  dark: localStorage.getItem('qm_theme') === 'dark',
  toggle: () => set(state => {
    const next = !state.dark
    localStorage.setItem('qm_theme', next ? 'dark' : 'light')
    if (next) document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
    return { dark: next }
  }),
  init: () => {
    const dark = localStorage.getItem('qm_theme') === 'dark'
    if (dark) document.documentElement.classList.add('dark')
    return dark
  }
}))

export default useThemeStore
