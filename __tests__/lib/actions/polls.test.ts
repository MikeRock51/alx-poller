import {
  createPoll,
  getPolls,
  getPollById,
  getUserPolls,
  deletePoll,
  updatePoll,
  voteOnPoll,
  hasUserVoted,
} from '@/lib/actions/polls'
import { CreatePollFormData } from '@/types'

// Mock Next.js functions
jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}))

// Mock Supabase client with comprehensive method chaining support
const mockSupabaseClient = {
  auth: {
    getUser: jest.fn(),
  },
  from: jest.fn(),
}

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => mockSupabaseClient),
}))

// Helper to create a comprehensive Supabase query builder mock
const createSupabaseQueryBuilder = (result: any = { data: null, error: null }) => {
  const mockSingle = jest.fn().mockResolvedValue(result)
  const mockSelect = jest.fn().mockReturnThis()
  const mockInsert = jest.fn().mockReturnThis()
  const mockUpdate = jest.fn().mockReturnThis()
  const mockDelete = jest.fn().mockReturnThis()
  const mockEq = jest.fn().mockReturnThis()
  const mockOrder = jest.fn().mockReturnThis()
  const mockIn = jest.fn().mockReturnThis()

  // Set up the method chaining properly
  mockSelect.mockReturnValue({
    eq: mockEq,
    order: mockOrder,
    in: mockIn,
  })

  mockInsert.mockReturnValue({
    select: jest.fn().mockReturnValue({
      single: mockSingle,
    }),
  })

  mockUpdate.mockReturnValue({
    eq: mockEq,
  })

  mockDelete.mockReturnValue({
    eq: mockEq,
  })

  // Enhanced eq() chaining to support multiple .eq() calls followed by .single()
  mockEq.mockReturnValue({
    eq: mockEq,
    single: mockSingle,
    order: mockOrder,
    select: mockSelect,
  })

  mockOrder.mockReturnValue(result)
  mockIn.mockReturnValue({
    select: mockSelect,
  })

  return {
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDelete,
    eq: mockEq,
    single: mockSingle,
    order: mockOrder,
    in: mockIn,
  }
}

describe('Polls Actions - Basic Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Function exports', () => {
    it('should export createPoll function', () => {
      expect(typeof createPoll).toBe('function')
    })

    it('should export getPolls function', () => {
      expect(typeof getPolls).toBe('function')
    })

    it('should export getPollById function', () => {
      expect(typeof getPollById).toBe('function')
    })

    it('should export getUserPolls function', () => {
      expect(typeof getUserPolls).toBe('function')
    })

    it('should export deletePoll function', () => {
      expect(typeof deletePoll).toBe('function')
    })

    it('should export updatePoll function', () => {
      expect(typeof updatePoll).toBe('function')
    })

    it('should export voteOnPoll function', () => {
      expect(typeof voteOnPoll).toBe('function')
    })

    it('should export hasUserVoted function', () => {
      expect(typeof hasUserVoted).toBe('function')
    })
  })

  describe('Authentication checks', () => {
    it('should handle unauthenticated createPoll', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      const result = await createPoll({
        title: 'Test',
        options: ['A', 'B'],
        isPublic: true,
      })

      expect(result.success).toBeUndefined()
      expect(result.error).toBe('You must be logged in to create a poll')
    })

    it('should handle unauthenticated getUserPolls', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      const result = await getUserPolls()
      expect(result.error).toBe('You must be logged in to view your polls')
    })

    it('should handle unauthenticated deletePoll', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      const result = await deletePoll('poll-id')
      expect(result.error).toBe('You must be logged in to delete a poll')
    })

    it('should handle unauthenticated updatePoll', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      const result = await updatePoll('poll-id', {
        title: 'Updated',
        options: ['A', 'B'],
        isPublic: true,
      })
      expect(result.error).toBe('You must be logged in to update a poll')
    })

    it('should handle unauthenticated voteOnPoll', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      const result = await voteOnPoll('poll-id', 'option-id')
      expect(result.error).toBe('You must be logged in to vote')
    })
  })

  describe('Input validation', () => {
    beforeEach(() => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      })
    })

    it('should validate poll title is required', async () => {
      const result = await createPoll({
        title: '',
        options: ['A', 'B'],
        isPublic: true,
      })

      expect(result.error).toBe('Poll title is required')
    })

    it('should validate minimum options requirement', async () => {
      const result = await createPoll({
        title: 'Test Poll',
        options: ['Only one'],
        isPublic: true,
      })

      expect(result.error).toBe('A poll must have at least 2 options')
    })

    it('should validate minimum unique options', async () => {
      const result = await createPoll({
        title: 'Test Poll',
        options: ['Same', 'Same', '', '  '],
        isPublic: true,
      })

      expect(result.error).toBe('A poll must have at least 2 unique, non-empty options')
    })
  })

  describe('Error handling', () => {
    it('should handle database errors in getPolls', async () => {
      const pollsQueryBuilder = createSupabaseQueryBuilder({
        data: null,
        error: { message: 'Database error' },
      })

      mockSupabaseClient.from.mockImplementation((tableName: string) => {
        if (tableName === 'polls') {
          return pollsQueryBuilder
        }
        return createSupabaseQueryBuilder()
      })

      const result = await getPolls()
      expect(result.error).toBe('Failed to fetch polls')
    })

    it('should handle not found errors in getPollById', async () => {
      const pollsQueryBuilder = createSupabaseQueryBuilder({
        data: null,
        error: { message: 'Not found' },
      })

      mockSupabaseClient.from.mockImplementation((tableName: string) => {
        if (tableName === 'polls') {
          return pollsQueryBuilder
        }
        return createSupabaseQueryBuilder()
      })

      const result = await getPollById('non-existent')
      expect(result.error).toBe('Poll not found')
    })
  })

  describe('Successful operations', () => {
    beforeEach(() => {
      jest.clearAllMocks()
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      })
    })

    it('should handle successful poll creation flow', async () => {
      // Arrange
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null,
      })

      const mockPoll = { id: 'poll-123', title: 'Test Poll' }
      const pollQueryBuilder = createSupabaseQueryBuilder({ data: mockPoll, error: null })
      const optionsQueryBuilder = createSupabaseQueryBuilder({ error: null })

      // Mock the from() method to return different builders based on table name
      mockSupabaseClient.from.mockImplementation((tableName: string) => {
        if (tableName === 'polls') {
          return pollQueryBuilder
        } else if (tableName === 'poll_options') {
          return optionsQueryBuilder
        }
        return createSupabaseQueryBuilder()
      })

      // Act
      const result = await createPoll({
        title: 'Test Poll',
        options: ['Option 1', 'Option 2'],
        isPublic: true,
      })

      // Assert
      expect(result.success).toBe(true)
      expect(result.poll).toBeDefined()
    })

    it('should handle successful poll retrieval', async () => {
      // Arrange
      const mockPolls = [
        { id: 'poll-1', title: 'Poll 1', total_votes: 0 },
        { id: 'poll-2', title: 'Poll 2', total_votes: 0 },
      ]

      const pollsQueryBuilder = createSupabaseQueryBuilder({
        data: mockPolls,
        error: null
      })

      // Mock for votes query (returns empty to avoid complex chaining)
      const votesQueryBuilder = createSupabaseQueryBuilder({
        data: [],
        error: null
      })

      mockSupabaseClient.from.mockImplementation((tableName: string) => {
        if (tableName === 'polls') {
          return pollsQueryBuilder
        } else if (tableName === 'votes') {
          return votesQueryBuilder
        }
        return createSupabaseQueryBuilder()
      })

      // Act
      const result = await getPolls()

      // Assert
      expect(result.polls).toHaveLength(2)
      expect(result.polls[0].title).toBe('Poll 1')
      expect(result.polls[1].title).toBe('Poll 2')
    })

    it('should handle successful vote checking', async () => {
      // Use the improved query builder for proper method chaining
      const votesQueryBuilder = createSupabaseQueryBuilder({
        data: null,
        error: { code: 'PGRST116' }, // No rows found (user hasn't voted)
      })

      mockSupabaseClient.from.mockImplementation((tableName: string) => {
        if (tableName === 'votes') {
          return votesQueryBuilder
        }
        return createSupabaseQueryBuilder()
      })

      const result = await hasUserVoted('poll-123', 'user-123')
      expect(result).toBe(false)
    })
  })
})