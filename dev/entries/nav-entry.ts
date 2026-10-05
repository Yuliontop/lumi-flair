import { StoryNavigator, NAVIGATE_CSS } from '../../src/navigate'
const st = document.createElement('style'); st.textContent = NAVIGATE_CSS; document.head.appendChild(st)
;(window as any).StoryNavigator = StoryNavigator
