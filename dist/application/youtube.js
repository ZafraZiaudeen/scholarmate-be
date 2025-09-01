"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCuratedRecommendations = exports.getPlaylistVideos = exports.getVideoDetails = exports.searchVideos = void 0;
const axios_1 = __importDefault(require("axios"));
const CuratedVideo_1 = __importDefault(require("../infrastructure/schemas/CuratedVideo"));
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const YOUTUBE_BASE_URL = "https://www.googleapis.com/youtube/v3";
// Curated educational channels for O/L IT
const EDUCATIONAL_CHANNELS = [
    "UCWv7vMbMWH4-V0ZXdmDpPBA", // Programming with Mosh
    "UCsBjURrPoezykLs9EqgamOA", // Fireship
    "UC8butISFwT-Wl7EV0hUK0BQ", // freeCodeCamp
    "UCVTlvUkGslCV_h-nSAId8Sw", // CodeWithHarry
];
// Search for educational videos (now supports both curated and YouTube search)
const searchVideos = async (req, res, next) => {
    try {
        const { query = "HTML CSS JavaScript tutorial", maxResults = 12, pageToken, channelId, order = "relevance", useCurated = "true" // New parameter to control curated vs YouTube search
         } = req.query;
        // If useCurated is true, try to get curated videos first
        if (useCurated === "true") {
            try {
                // Try to find matching curated videos
                const curatedVideos = await CuratedVideo_1.default.find({
                    isActive: true,
                    $or: [
                        { title: { $regex: query, $options: 'i' } },
                        { description: { $regex: query, $options: 'i' } },
                        { tags: { $in: [query.split(' ')] } }
                    ]
                })
                    .populate('categoryId')
                    .sort({ order: 1, createdAt: -1 })
                    .limit(parseInt(maxResults));
                if (curatedVideos.length > 0) {
                    const formattedVideos = curatedVideos.map(video => ({
                        id: video.videoId,
                        title: video.title,
                        description: video.description,
                        thumbnail: video.thumbnail,
                        channelTitle: video.channelTitle,
                        publishedAt: video.publishedAt,
                        duration: video.duration,
                        viewCount: video.viewCount,
                        likeCount: video.likeCount,
                        url: video.url,
                        category: video.categoryId
                    }));
                    return res.json({
                        success: true,
                        data: {
                            videos: formattedVideos,
                            totalResults: curatedVideos.length,
                            source: "curated"
                        }
                    });
                }
            }
            catch (curatedError) {
                console.error("Error fetching curated videos:", curatedError);
                // Fall back to YouTube search if curated search fails
            }
        }
        // Fall back to YouTube API search
        // Check if YouTube API key is available
        if (!YOUTUBE_API_KEY) {
            console.error("YouTube API key is not configured");
            return res.status(500).json({
                success: false,
                error: "YouTube API key is not configured"
            });
        }
        // Enhanced search query for O/L IT content
        const searchQuery = `${query} tutorial beginner web development HTML CSS JavaScript`;
        const params = {
            part: "snippet",
            q: searchQuery,
            type: "video",
            maxResults: parseInt(maxResults),
            order,
            key: YOUTUBE_API_KEY,
            videoDefinition: "high",
            videoDuration: "medium", // 4-20 minutes
            relevanceLanguage: "en",
            safeSearch: "strict"
        };
        if (pageToken)
            params.pageToken = pageToken;
        if (channelId)
            params.channelId = channelId;
        const response = await axios_1.default.get(`${YOUTUBE_BASE_URL}/search`, { params });
        const videoIds = response.data.items.map((item) => item.id.videoId).join(",");
        // Get additional video details
        let detailsResponse;
        try {
            detailsResponse = await axios_1.default.get(`${YOUTUBE_BASE_URL}/videos`, {
                params: {
                    part: "contentDetails,statistics",
                    id: videoIds,
                    key: YOUTUBE_API_KEY
                }
            });
        }
        catch (detailsError) {
            console.error("YouTube video details fetch error:", detailsError.response?.data || detailsError.message);
            detailsResponse = { data: { items: [] } };
        }
        const videosWithDetails = response.data.items.map((item) => {
            const details = detailsResponse.data.items.find((detail) => detail.id === item.id.videoId);
            return {
                id: item.id.videoId,
                title: item.snippet.title,
                description: item.snippet.description,
                thumbnail: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default.url,
                channelTitle: item.snippet.channelTitle,
                publishedAt: item.snippet.publishedAt,
                duration: details?.contentDetails?.duration,
                viewCount: details?.statistics?.viewCount,
                likeCount: details?.statistics?.likeCount,
                url: `https://www.youtube.com/watch?v=${item.id.videoId}`
            };
        });
        res.json({
            success: true,
            data: {
                videos: videosWithDetails,
                nextPageToken: response.data.nextPageToken,
                prevPageToken: response.data.prevPageToken,
                totalResults: response.data.pageInfo.totalResults,
                source: "youtube"
            }
        });
    }
    catch (error) {
        console.error("YouTube search error:", error.response?.data || error.message);
        res.status(500).json({
            success: false,
            error: "Failed to search videos",
            details: error.response?.data?.error?.message || error.message
        });
    }
};
exports.searchVideos = searchVideos;
// Get specific video details
const getVideoDetails = async (req, res, next) => {
    try {
        const { videoId } = req.params;
        const response = await axios_1.default.get(`${YOUTUBE_BASE_URL}/videos`, {
            params: {
                part: "snippet,contentDetails,statistics",
                id: videoId,
                key: YOUTUBE_API_KEY
            }
        });
        if (response.data.items.length === 0) {
            return res.status(404).json({
                success: false,
                error: "Video not found"
            });
        }
        const video = response.data.items[0];
        const videoDetails = {
            id: video.id,
            title: video.snippet.title,
            description: video.snippet.description,
            thumbnail: video.snippet.thumbnails.medium?.url || video.snippet.thumbnails.default.url,
            channelTitle: video.snippet.channelTitle,
            publishedAt: video.snippet.publishedAt,
            duration: video.contentDetails.duration,
            viewCount: video.statistics.viewCount,
            likeCount: video.statistics.likeCount,
            commentCount: video.statistics.commentCount,
            url: `https://www.youtube.com/watch?v=${video.id}`,
            embedUrl: `https://www.youtube.com/embed/${video.id}`
        };
        res.json({
            success: true,
            data: videoDetails
        });
    }
    catch (error) {
        console.error("YouTube video details error:", error.response?.data || error.message);
        res.status(500).json({
            success: false,
            error: "Failed to get video details"
        });
    }
};
exports.getVideoDetails = getVideoDetails;
// Get playlist videos
const getPlaylistVideos = async (req, res, next) => {
    try {
        const { playlistId } = req.params;
        const { maxResults = 20, pageToken } = req.query;
        const params = {
            part: "snippet",
            playlistId,
            maxResults: parseInt(maxResults),
            key: YOUTUBE_API_KEY
        };
        if (pageToken)
            params.pageToken = pageToken;
        const response = await axios_1.default.get(`${YOUTUBE_BASE_URL}/playlistItems`, { params });
        const videos = response.data.items.map((item) => ({
            id: item.snippet.resourceId.videoId,
            title: item.snippet.title,
            description: item.snippet.description,
            thumbnail: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default.url,
            channelTitle: item.snippet.channelTitle,
            publishedAt: item.snippet.publishedAt,
            position: item.snippet.position,
            url: `https://www.youtube.com/watch?v=${item.snippet.resourceId.videoId}`
        }));
        res.json({
            success: true,
            data: {
                videos,
                nextPageToken: response.data.nextPageToken,
                prevPageToken: response.data.prevPageToken
            }
        });
    }
    catch (error) {
        console.error("YouTube playlist error:", error.response?.data || error.message);
        res.status(500).json({
            success: false,
            error: "Failed to get playlist videos"
        });
    }
};
exports.getPlaylistVideos = getPlaylistVideos;
// Get curated recommendations for O/L IT topics
const getCuratedRecommendations = async (topic) => {
    const topicQueries = {
        "html": "HTML basics tutorial beginner web development tags elements",
        "css": "CSS tutorial beginner styling selectors properties layout",
        "javascript": "JavaScript tutorial beginner programming variables functions",
        "web-design": "web design tutorial HTML CSS responsive design",
        "multimedia": "web multimedia tutorial audio video HTML5",
        "forms": "HTML forms tutorial input validation web development",
        "responsive": "responsive web design tutorial CSS media queries",
        "animations": "CSS animations tutorial transitions keyframes"
    };
    const searchQuery = topicQueries[topic.toLowerCase()] || `${topic} tutorial web development`;
    try {
        const response = await axios_1.default.get(`${YOUTUBE_BASE_URL}/search`, {
            params: {
                part: "snippet",
                q: searchQuery,
                type: "video",
                maxResults: 8,
                order: "relevance",
                key: YOUTUBE_API_KEY,
                videoDefinition: "high",
                videoDuration: "medium",
                relevanceLanguage: "en",
                safeSearch: "strict"
            }
        });
        return response.data.items.map((item) => ({
            id: item.id.videoId,
            title: item.snippet.title,
            description: item.snippet.description,
            thumbnail: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default.url,
            channelTitle: item.snippet.channelTitle,
            publishedAt: item.snippet.publishedAt,
            url: `https://www.youtube.com/watch?v=${item.id.videoId}`
        }));
    }
    catch (error) {
        console.error("Error getting curated recommendations:", error);
        return [];
    }
};
exports.getCuratedRecommendations = getCuratedRecommendations;
//# sourceMappingURL=youtube.js.map