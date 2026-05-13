const API_BASE_URL = 'http://localhost:8080/api';

const fetchWithTimeout = async (url, options = {}, timeout = 10000) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal,
        });
        clearTimeout(id);
        return response;
    } catch (error) {
        clearTimeout(id);
        throw error;
    }
};

export const mindmapApi = {
    save: async (data, id = null) => {
        const url = id ? `${API_BASE_URL}/mindmap/${id}` : `${API_BASE_URL}/mindmap`;
        const method = id ? 'PUT' : 'POST';

        const response = await fetchWithTimeout(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: '保存失败' }));
            throw new Error(error.message || '保存失败');
        }

        return response.json();
    },

    load: async (id) => {
        const response = await fetchWithTimeout(`${API_BASE_URL}/mindmap/${id}`);

        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: '加载失败' }));
            throw new Error(error.message || '加载失败');
        }

        return response.json();
    },

    list: async () => {
        const response = await fetchWithTimeout(`${API_BASE_URL}/mindmap`);

        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: '获取列表失败' }));
            throw new Error(error.message || '获取列表失败');
        }

        return response.json();
    },

    delete: async (id) => {
        const response = await fetchWithTimeout(`${API_BASE_URL}/mindmap/${id}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: '删除失败' }));
            throw new Error(error.message || '删除失败');
        }

        return response.json();
    },
};

export default mindmapApi;
