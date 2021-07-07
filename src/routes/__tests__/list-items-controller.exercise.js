import * as generate from 'utils/generate'
import * as booksDB from '../../db/books'
import * as listItemsController from '../list-items-controller'

jest.mock('../../db/books')

describe('listItemsController use cases', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('getListItem returns the req.listItem', async () => {
    const user = generate.buildUser()
    const book = generate.buildBook()
    const listItem = generate.buildListItem({ownerId: user.id, bookId: book.id})

    booksDB.readById.mockResolvedValueOnce(book)

    const req = generate.buildReq({listItem})
    const res = generate.buildRes()

    await listItemsController.getListItem(req, res)

    expect(booksDB.readById).toHaveBeenCalledWith(listItem.bookId)
    expect(booksDB.readById).toHaveBeenCalledTimes(1)
    expect(res.json).toHaveBeenCalledTimes(1)
    expect(res.json).toHaveBeenCalledWith({listItem: {...listItem, book}})
  })
})
