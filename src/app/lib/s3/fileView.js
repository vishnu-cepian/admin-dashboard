import api from "@/app/lib/api/axios";

export const fileView = async (fileName) => {
    const res = await api.post('/api/s3/s3-presigned-view-url', {
        fileName: fileName
    })
    return res.data.data
}