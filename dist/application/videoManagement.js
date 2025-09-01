"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchYouTubeForCuration = exports.deleteCuratedVideo = exports.updateCuratedVideo = exports.getCuratedVideosByCategory = exports.getAllCuratedVideos = exports.addCuratedVideo = exports.deleteVideoCategory = exports.updateVideoCategory = exports.getVideoCategoryById = exports.getAllVideoCategories = exports.createVideoCategory = void 0;
const VideoCategory_1 = __importDefault(require("../infrastructure/schemas/VideoCategory"));
const CuratedVideo_1 = __importDefault(require("../infrastructure/schemas/CuratedVideo"));
const axios_1 = __importDefault(require("axios"));
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const YOUTUBE_BASE_URL = "https://www.googleapis.com/youtube/v3";
// Video Categories Management
// Create a new video category
const createVideoCategory = async (req, res, next) => {
    try {
        const { name, description, searchQuery, icon, color, order } = req.body;
        if (!name || !description || !searchQuery) {
            res.status(400).json({
                success: false,
                error: 'Name, description, and search query are required'
            });
            return;
        }
        const category = new VideoCategory_1.default({
            name,
            description,
            searchQuery,
            icon: icon || 'BookOpen',
            color: color || 'bg-blue-100 text-blue-700 border-blue-200',
            order: order || 0,
            createdBy: req.user?.id
        });
        await category.save();
        res.status(201).json({
            success: true,
            message: 'Video category created successfully',
            data: category
        });
    }
    catch (error) {
        if (error.code === 11000) {
            res.status(400).json({
                success: false,
                error: 'Category name already exists'
            });
            return;
        }
        console.error('Error creating video category:', error);
        next(error);
    }
};
exports.createVideoCategory = createVideoCategory;
// Get all video categories
const getAllVideoCategories = async (req, res, next) => {
    try {
        const { includeInactive } = req.query;
        const query = {};
        if (!includeInactive || includeInactive === 'false') {
            query.isActive = true;
        }
        const categories = await VideoCategory_1.default.find(query).sort({ order: 1, createdAt: 1 });
        res.status(200).json({
            success: true,
            data: categories
        });
    }
    catch (error) {
        console.error('Error fetching video categories:', error);
        next(error);
    }
};
exports.getAllVideoCategories = getAllVideoCategories;
// Get video category by ID
const getVideoCategoryById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const category = await VideoCategory_1.default.findById(id);
        if (!category) {
            res.status(404).json({
                success: false,
                error: 'Video category not found'
            });
            return;
        }
        res.status(200).json({
            success: true,
            data: category
        });
    }
    catch (error) {
        console.error('Error fetching video category:', error);
        next(error);
    }
};
exports.getVideoCategoryById = getVideoCategoryById;
// Update video category
const updateVideoCategory = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, description, searchQuery, icon, color, order, isActive } = req.body;
        const updateData = {};
        if (name)
            updateData.name = name;
        if (description)
            updateData.description = description;
        if (searchQuery)
            updateData.searchQuery = searchQuery;
        if (icon)
            updateData.icon = icon;
        if (color)
            updateData.color = color;
        if (order !== undefined)
            updateData.order = order;
        if (isActive !== undefined)
            updateData.isActive = isActive;
        const category = await VideoCategory_1.default.findByIdAndUpdate(id, { $set: updateData }, { new: true });
        if (!category) {
            res.status(404).json({
                success: false,
                error: 'Video category not found'
            });
            return;
        }
        res.status(200).json({
            success: true,
            message: 'Video category updated successfully',
            data: category
        });
    }
    catch (error) {
        if (error.code === 11000) {
            res.status(400).json({
                success: false,
                error: 'Category name already exists'
            });
            return;
        }
        console.error('Error updating video category:', error);
        next(error);
    }
};
exports.updateVideoCategory = updateVideoCategory;
// Delete video category
const deleteVideoCategory = async (req, res, next) => {
    try {
        const { id } = req.params;
        // Check if there are curated videos in this category
        const videosCount = await CuratedVideo_1.default.countDocuments({ categoryId: id });
        if (videosCount > 0) {
            res.status(400).json({
                success: false,
                error: 'Cannot delete category with existing videos. Please move or delete videos first.'
            });
            return;
        }
        const category = await VideoCategory_1.default.findByIdAndDelete(id);
        if (!category) {
            res.status(404).json({
                success: false,
                error: 'Video category not found'
            });
            return;
        }
        res.status(200).json({
            success: true,
            message: 'Video category deleted successfully'
        });
    }
    catch (error) {
        console.error('Error deleting video category:', error);
        next(error);
    }
};
exports.deleteVideoCategory = deleteVideoCategory;
// Curated Videos Management
// Add video to curated list (from YouTube search or manual entry)
const addCuratedVideo = async (req, res, next) => {
    try {
        const { videoId, categoryId, order, tags, adminNotes, 
        // Optional: if video details are not provided, fetch from YouTube
        title, description, thumbnail, channelTitle, publishedAt, duration, viewCount, likeCount } = req.body;
        if (!videoId || !categoryId) {
            res.status(400).json({
                success: false,
                error: 'Video ID and category ID are required'
            });
            return;
        }
        // Check if category exists
        const category = await VideoCategory_1.default.findById(categoryId);
        if (!category) {
            res.status(404).json({
                success: false,
                error: 'Video category not found'
            });
            return;
        }
        // Check if video already exists
        const existingVideo = await CuratedVideo_1.default.findOne({ videoId });
        if (existingVideo) {
            res.status(400).json({
                success: false,
                error: 'Video already exists in curated list'
            });
            return;
        }
        let videoData = {
            videoId,
            categoryId,
            order: order || 0,
            tags: tags || [],
            adminNotes,
            createdBy: req.user?.id,
            url: `https://www.youtube.com/watch?v=${videoId}`
        };
        // If video details are provided, use them; otherwise fetch from YouTube
        if (title && description && thumbnail && channelTitle && publishedAt) {
            videoData = {
                ...videoData,
                title,
                description,
                thumbnail,
                channelTitle,
                publishedAt,
                duration,
                viewCount,
                likeCount
            };
        }
        else if (YOUTUBE_API_KEY) {
            // Fetch video details from YouTube API
            try {
                const response = await axios_1.default.get(`${YOUTUBE_BASE_URL}/videos`, {
                    params: {
                        part: 'snippet,contentDetails,statistics',
                        id: videoId,
                        key: YOUTUBE_API_KEY
                    }
                });
                if (response.data.items.length === 0) {
                    res.status(404).json({
                        success: false,
                        error: 'Video not found on YouTube'
                    });
                    return;
                }
                const video = response.data.items[0];
                videoData = {
                    ...videoData,
                    title: video.snippet.title,
                    description: video.snippet.description,
                    thumbnail: video.snippet.thumbnails.medium?.url || video.snippet.thumbnails.default.url,
                    channelTitle: video.snippet.channelTitle,
                    publishedAt: video.snippet.publishedAt,
                    duration: video.contentDetails.duration,
                    viewCount: video.statistics.viewCount,
                    likeCount: video.statistics.likeCount
                };
            }
            catch (youtubeError) {
                console.error('Error fetching video from YouTube:', youtubeError);
                res.status(400).json({
                    success: false,
                    error: 'Failed to fetch video details from YouTube'
                });
                return;
            }
        }
        else {
            res.status(400).json({
                success: false,
                error: 'Video details must be provided or YouTube API key must be configured'
            });
            return;
        }
        const curatedVideo = new CuratedVideo_1.default(videoData);
        await curatedVideo.save();
        // Populate category information
        await curatedVideo.populate('categoryId');
        res.status(201).json({
            success: true,
            message: 'Video added to curated list successfully',
            data: curatedVideo
        });
    }
    catch (error) {
        console.error('Error adding curated video:', error);
        next(error);
    }
};
exports.addCuratedVideo = addCuratedVideo;
// Get all curated videos
const getAllCuratedVideos = async (req, res, next) => {
    try {
        const { categoryId, includeInactive, tags } = req.query;
        const query = {};
        if (categoryId)
            query.categoryId = categoryId;
        if (!includeInactive || includeInactive === 'false') {
            query.isActive = true;
        }
        if (tags) {
            const tagArray = tags.split(',');
            query.tags = { $in: tagArray };
        }
        const videos = await CuratedVideo_1.default.find(query)
            .populate('categoryId')
            .sort({ categoryId: 1, order: 1, createdAt: 1 });
        res.status(200).json({
            success: true,
            data: videos
        });
    }
    catch (error) {
        console.error('Error fetching curated videos:', error);
        next(error);
    }
};
exports.getAllCuratedVideos = getAllCuratedVideos;
// Get curated videos by category
const getCuratedVideosByCategory = async (req, res, next) => {
    try {
        const { categoryId } = req.params;
        const { includeInactive } = req.query;
        const query = { categoryId };
        if (!includeInactive || includeInactive === 'false') {
            query.isActive = true;
        }
        const videos = await CuratedVideo_1.default.find(query)
            .populate('categoryId')
            .sort({ order: 1, createdAt: 1 });
        res.status(200).json({
            success: true,
            data: videos
        });
    }
    catch (error) {
        console.error('Error fetching curated videos by category:', error);
        next(error);
    }
};
exports.getCuratedVideosByCategory = getCuratedVideosByCategory;
// Update curated video
const updateCuratedVideo = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { categoryId, order, tags, adminNotes, isActive, title, description } = req.body;
        const updateData = {};
        if (categoryId) {
            // Verify category exists
            const category = await VideoCategory_1.default.findById(categoryId);
            if (!category) {
                res.status(404).json({
                    success: false,
                    error: 'Video category not found'
                });
                return;
            }
            updateData.categoryId = categoryId;
        }
        if (order !== undefined)
            updateData.order = order;
        if (tags)
            updateData.tags = tags;
        if (adminNotes !== undefined)
            updateData.adminNotes = adminNotes;
        if (isActive !== undefined)
            updateData.isActive = isActive;
        if (title)
            updateData.title = title;
        if (description)
            updateData.description = description;
        const video = await CuratedVideo_1.default.findByIdAndUpdate(id, { $set: updateData }, { new: true })
            .populate('categoryId');
        if (!video) {
            res.status(404).json({
                success: false,
                error: 'Curated video not found'
            });
            return;
        }
        res.status(200).json({
            success: true,
            message: 'Curated video updated successfully',
            data: video
        });
    }
    catch (error) {
        console.error('Error updating curated video:', error);
        next(error);
    }
};
exports.updateCuratedVideo = updateCuratedVideo;
// Delete curated video
const deleteCuratedVideo = async (req, res, next) => {
    try {
        const { id } = req.params;
        const video = await CuratedVideo_1.default.findByIdAndDelete(id);
        if (!video) {
            res.status(404).json({
                success: false,
                error: 'Curated video not found'
            });
            return;
        }
        res.status(200).json({
            success: true,
            message: 'Curated video deleted successfully'
        });
    }
    catch (error) {
        console.error('Error deleting curated video:', error);
        next(error);
    }
};
exports.deleteCuratedVideo = deleteCuratedVideo;
// Search YouTube videos for curation (admin helper function)
const searchYouTubeForCuration = async (req, res, next) => {
    try {
        if (!YOUTUBE_API_KEY) {
            res.status(500).json({
                success: false,
                error: 'YouTube API key is not configured'
            });
            return;
        }
        const { query, maxResults = 20 } = req.query;
        if (!query) {
            res.status(400).json({
                success: false,
                error: 'Search query is required'
            });
            return;
        }
        const response = await axios_1.default.get(`${YOUTUBE_BASE_URL}/search`, {
            params: {
                part: 'snippet',
                q: query,
                type: 'video',
                maxResults: parseInt(maxResults),
                order: 'relevance',
                key: YOUTUBE_API_KEY,
                videoDefinition: 'high',
                videoDuration: 'medium',
                relevanceLanguage: 'en',
                safeSearch: 'strict'
            }
        });
        const videoIds = response.data.items.map((item) => item.id.videoId).join(',');
        // Get additional video details
        const detailsResponse = await axios_1.default.get(`${YOUTUBE_BASE_URL}/videos`, {
            params: {
                part: 'contentDetails,statistics',
                id: videoIds,
                key: YOUTUBE_API_KEY
            }
        });
        const videosWithDetails = response.data.items.map((item) => {
            const details = detailsResponse.data.items.find((detail) => detail.id === item.id.videoId);
            return {
                videoId: item.id.videoId,
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
                totalResults: response.data.pageInfo.totalResults
            }
        });
    }
    catch (error) {
        console.error('YouTube search error:', error.response?.data || error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to search videos',
            details: error.response?.data?.error?.message || error.message
        });
    }
};
exports.searchYouTubeForCuration = searchYouTubeForCuration;
//# sourceMappingURL=videoManagement.js.map