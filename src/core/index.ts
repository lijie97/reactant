import ReActantRenderer from './renderer';
import { AgentContainer } from './container';
import { ReactNode } from 'react';

export * from './components';
export * from './container';
export * from './types';

export function createRoot(container: AgentContainer) {
    const root = ReActantRenderer.createContainer(
        container,
        0, // LegacyRoot
        null,
        false,
        null,
        "",
        (e: any) => { console.error("ReActant Error:", e) },
        null
    );
    
    return {
        render(element: ReactNode) {
            return new Promise<void>((resolve) => {
                ReActantRenderer.updateContainer(element, root, null, () => {
                    resolve();
                });
            });
        },
        unmount() {
            ReActantRenderer.updateContainer(null, root, null, () => {});
        }
    };
}


