import { useEffect, useState } from 'react';
import { snapshot$ } from '../../engine/store';

export function useSnapshot() {
    const [snap, setSnap] = useState(snapshot$.value);

    useEffect(() => {
        const sub = snapshot$.subscribe(setSnap);
        return () => sub.unsubscribe();
    }, []);

    return snap;
}