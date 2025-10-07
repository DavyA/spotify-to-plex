/* eslint-disable unicorn/consistent-destructuring */
/* eslint-disable react/display-name */
import { errorBoundary } from "@/helpers/errors/errorBoundary";
import { GetSpotifyTrackByIdResponse } from "@/pages/api/spotify/tracks/[id]";
import { CheckCircle, Close } from "@mui/icons-material";
import { Box, CircularProgress, Divider, Typography } from "@mui/material";
import type { PlexTrack } from "@spotify-to-plex/plex-music-search/types/PlexTrack";
import type { SearchQuery, SearchResponse } from "@spotify-to-plex/plex-music-search/types/SearchResponse";
import axios from "axios";
import { forwardRef, Fragment, useCallback, useImperativeHandle, useState } from "react";

type TrackAnalyzerHandles = {
    readonly analyze: (trackId: string, type: 'plex' | 'tidal') => void
}

const TrackAnalyzer = forwardRef<TrackAnalyzerHandles, unknown>((_props, ref) => {

    const [loading, setLoading] = useState(false)
    const [trackLoading, setTrackLoading] = useState(false)
    const [track, setTrack] = useState<GetSpotifyTrackByIdResponse>()
    const [searchResponse, setSearchResponse] = useState<SearchResponse>()

    useImperativeHandle(ref, () => ({
        analyze: (trackId: string, type: 'plex' | 'tidal') => {
            analyzeTrack(trackId, type)
        }
    }))

    const analyzeTrack = useCallback((trackId: string, type: 'plex' | 'tidal') => {

        errorBoundary(async () => {
            setTrackLoading(true)
            setLoading(true)

            setTrack(undefined)
            setSearchResponse(undefined)

            // First load the Spotify track data
            const trackResult = await axios.get<GetSpotifyTrackByIdResponse>(`/api/spotify/tracks/${trackId}`)
            setTrack(trackResult.data)
            setTrackLoading(false)

            // Then analyze with the specified service
            const analyzeEndpoint = type === 'plex' ? '/api/plex/analyze' : '/api/tidal/analyze';
            const analyzeResult = await axios.post(analyzeEndpoint, {
                item: trackResult.data
            })

            setSearchResponse(analyzeResult.data)
            setLoading(false)
        })
    }, [])

    const getRoundedSimilarity = (value: number) => {
        return `${Math.round(value * 100)}%`
    }

    return (
        <Box>
            {Boolean(trackLoading || loading) && (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 5 }}>
                    <CircularProgress />
                </Box>
            )}

            {Boolean(!trackLoading && !loading && track && searchResponse) && (
                <>
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle1" sx={{ mb: 1 }}>
                            Track Being Searched
                        </Typography>
                        <Divider sx={{ mt: 1, mb: 2 }} />
                        <Typography variant="body1" mb={1}>
                            <strong>{track?.title}</strong>
                        </Typography>
                        <Box sx={{ flex: 1, display: 'flex' }}>
                            <Typography variant="body2" sx={{ width: '60px' }}>
                                <strong>Artists</strong>
                            </Typography>
                            <Typography variant="body2" sx={{ flex: 1 }}>
                                {track?.artists.join(', ')}
                            </Typography>
                        </Box>
                        <Box sx={{ flex: 1, display: 'flex' }}>
                            <Typography variant="body2" sx={{ width: '60px' }}>
                                <strong>Album</strong>
                            </Typography>
                            <Typography variant="body2" sx={{ flex: 1 }}>
                                {track?.album}
                            </Typography>
                        </Box>
                    </Box>

                    <Divider sx={{ mt: 1 }} />

                    {searchResponse?.queries?.map((query: SearchQuery, index: number) => {

                        const prevApproach = searchResponse?.queries?.[index - 1]?.approach;
                        const isNewSection = prevApproach !== query.approach;

                        const results = query.result || [];

                        return <Fragment key={`query-${index}`}>

                            {!!isNewSection &&
                                <Typography variant="body1" mb={1} mt={3}>
                                    Search Approach: <strong>{query.approach}</strong>
                                </Typography>
                            }
                            <Box sx={{ mb: 1, p: 1, bgcolor: 'action.hover', borderRadius: 1 }} >
                                <Typography variant="h6" sx={{ mb: 1, fontSize: "1.2em" }}>{query.title}</Typography>
                                <Box sx={{ flex: 1, display: 'flex' }}>
                                    <Typography variant="body2" sx={{ width: '60px' }}>
                                        <strong>Artist</strong>
                                    </Typography>
                                    <Typography variant="body2" sx={{ flex: 1 }}>
                                        {query.artist}
                                    </Typography>
                                </Box>
                                <Box sx={{ flex: 1, display: 'flex' }}>
                                    <Typography variant="body2" sx={{ width: '60px' }}>
                                        <strong>Album</strong>
                                    </Typography>
                                    <Typography variant="body2" sx={{ flex: 1 }}>
                                        {query.album}
                                    </Typography>
                                </Box>
                            </Box>

                            {results.length > 0 &&
                                <Box sx={{ mb: 1, p: 1, ml: 4 }} >

                                    {results.map((result: PlexTrack) => {

                                        const { id: resultId, title, artist, album, matching } = result;

                                        if (!matching)
                                            return null;

                                        const { isMatchingApproach } = matching;

                                        return <Box key={`result-${resultId}`} sx={{ mb: 1, p: 1, bgcolor: 'action.hover', borderRadius: 1 }} >
                                            <Box >
                                                <Typography variant="h6" sx={{ mb: 1, fontSize: "1.2em", display: "flex", alignItems: "center", gap: 1 }} >
                                                    {isMatchingApproach ? <CheckCircle sx={{ fontSize: "1.2em", color: "success.main" }} /> : <Close sx={{ fontSize: "1.2em", color: "error.main" }} />}
                                                    {title}
                                                </Typography>
                                                <Box sx={{ flex: 1, display: 'flex' }}>
                                                    <Typography variant="body2" sx={{ width: '60px' }}>
                                                        <strong>Artists</strong>
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ flex: 1 }}>
                                                        {artist.title}
                                                    </Typography>
                                                </Box>
                                                {!!album &&
                                                    <Box sx={{ flex: 1, display: 'flex' }}>
                                                        <Typography variant="body2" sx={{ width: '60px' }}>
                                                            <strong>Album</strong>
                                                        </Typography>
                                                        <Typography variant="body2" sx={{ flex: 1 }}>
                                                            {album.title}
                                                        </Typography>
                                                    </Box>
                                                }
                                            </Box>
                                            <Divider sx={{ mt: 1, mb: 1, borderColor: "black" }} />
                                            <Box sx={{ display: 'flex', mt: 1 }}>
                                                <Box sx={{ width: "160px" }}>
                                                    <Typography variant="body1"><strong>Title</strong></Typography>
                                                    <Typography variant="body2">Match: {matching.title.match ? "Yes" : "No"}</Typography>
                                                    <Typography variant="body2">Contains: {matching.title.contains ? "Yes" : "No"}</Typography>
                                                    <Typography variant="body2">Similarity: {getRoundedSimilarity(matching.title.similarity)}</Typography>
                                                </Box>
                                                <Box sx={{ width: "160px" }}>
                                                    <Typography variant="body1"><strong>Artist</strong></Typography>
                                                    <Typography variant="body2">Match: {matching.artist.match ? "Yes" : "No"}</Typography>
                                                    <Typography variant="body2">Contains: {matching.artist.contains ? "Yes" : "No"}</Typography>
                                                    <Typography variant="body2">Similarity: {getRoundedSimilarity(matching.artist.similarity)}</Typography>
                                                </Box>
                                                <Box sx={{ width: "160px" }}>
                                                    <Typography variant="body1"><strong>Artist in Title</strong></Typography>
                                                    <Typography variant="body2">Match: {matching.artistInTitle.match ? "Yes" : "No"}</Typography>
                                                    <Typography variant="body2">Contains: {matching.artistInTitle.contains ? "Yes" : "No"}</Typography>
                                                    <Typography variant="body2">Similarity: {getRoundedSimilarity(matching.artistInTitle.similarity)}</Typography>
                                                </Box>
                                                <Box sx={{ width: "160px" }}>
                                                    <Typography variant="body1"><strong>Artist with Title</strong></Typography>
                                                    <Typography variant="body2">Match: {matching.artistWithTitle.match ? "Yes" : "No"}</Typography>
                                                    <Typography variant="body2">Contains: {matching.artistWithTitle.contains ? "Yes" : "No"}</Typography>
                                                    <Typography variant="body2">Similarity: {getRoundedSimilarity(matching.artistWithTitle.similarity)}</Typography>
                                                </Box>
                                                <Box sx={{ width: "160px" }}>
                                                    <Typography variant="body1"><strong>Album</strong></Typography>
                                                    <Typography variant="body2">Match: {matching.album.match ? "Yes" : "No"}</Typography>
                                                    <Typography variant="body2">Contains: {matching.album.contains ? "Yes" : "No"}</Typography>
                                                    <Typography variant="body2">Similarity: {getRoundedSimilarity(matching.album.similarity)}</Typography>
                                                </Box>
                                            </Box>
                                        </Box>
                                    })}
                                </Box>
                            }

                        </Fragment>
                    })}

                    {/* <Divider sx={{ mt: 2, mb: 2 }} /> */}
                    {/* {searchResponse?.result && searchResponse.result.length > 0 ? (
                        <>
                            <Typography variant="subtitle1" sx={{ mb: 1 }}>
                                Matches Found
                            </Typography>
                            {searchResponse?.result.map(({ id, title, artist, matching }: PlexTrack) => {
                                if (!matching)
                                    return null;

                                return <Fragment key={`analyze-${id}`}>
                                    <Box>
                                        <Typography variant="h6" sx={{ mb: 1 }}>Match</Typography>
                                        <Typography variant="body1">{title}</Typography>
                                        <Typography variant="body2">{artist.title}</Typography>
                                    </Box>
                                    <Box key={id} sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                        <Box>
                                            <Typography variant="body1">Artist</Typography>
                                            <Typography variant="body2">Match: {matching.artist.match ? "Yes" : "No"}</Typography>
                                            <Typography variant="body2">Contains: {matching.artist.contains ? "Yes" : "No"}</Typography>
                                            <Typography variant="body2">Similarity: {getRoundedSimilarity(matching.artist.similarity)}</Typography>
                                        </Box>
                                        <Box>
                                            <Typography variant="body1">Artist in Title</Typography>
                                            <Typography variant="body2">Match: {matching.artistInTitle.match ? "Yes" : "No"}</Typography>
                                            <Typography variant="body2">Contains: {matching.artistInTitle.contains ? "Yes" : "No"}</Typography>
                                            <Typography variant="body2">Similarity: {getRoundedSimilarity(matching.artistInTitle.similarity)}</Typography>
                                        </Box>
                                        <Box>
                                            <Typography variant="body1">Artist with Title</Typography>
                                            <Typography variant="body2">Match: {matching.artistWithTitle.match ? "Yes" : "No"}</Typography>
                                            <Typography variant="body2">Contains: {matching.artistWithTitle.contains ? "Yes" : "No"}</Typography>
                                            <Typography variant="body2">Similarity: {getRoundedSimilarity(matching.artistWithTitle.similarity)}</Typography>
                                        </Box>
                                        <Box>
                                            <Typography variant="body1">Title</Typography>
                                            <Typography variant="body2">Match: {matching.title.match ? "Yes" : "No"}</Typography>
                                            <Typography variant="body2">Contains: {matching.title.contains ? "Yes" : "No"}</Typography>
                                            <Typography variant="body2">Similarity: {getRoundedSimilarity(matching.title.similarity)}</Typography>
                                        </Box>
                                        <Box>
                                            <Typography variant="body1">Album</Typography>
                                            <Typography variant="body2">Match: {matching.album.match ? "Yes" : "No"}</Typography>
                                            <Typography variant="body2">Contains: {matching.album.contains ? "Yes" : "No"}</Typography>
                                            <Typography variant="body2">Similarity: {getRoundedSimilarity(matching.album.similarity)}</Typography>
                                        </Box>
                                    </Box>

                                    <Divider sx={{ mt: 1, mb: 1 }} />
                                </Fragment>
                            })}
                        </>
                    ) : (
                        <Box sx={{ p: 2, bgcolor: 'warning.light', borderRadius: 1 }}>
                            <Typography variant="subtitle1" color="warning.dark">No Matches Found</Typography>
                            <Typography variant="body2" color="warning.dark">
                                None of the search queries above returned any results from your Plex library.
                                The track may not exist in your library, or the naming might be significantly different.
                            </Typography>
                        </Box>
                    )} */}
                </>
            )}
        </Box>
    )
})

export default TrackAnalyzer;