/* eslint-disable max-lines-per-function */
import {
  buildBook,
  buildListItem,
  buildNext,
  buildReq,
  buildRes,
  buildUser,
} from 'utils/generate';
import * as booksDB from '../../db/books';
import * as listItemsDB from '../../db/list-items';
import * as listItemsController from '../list-items-controller';

jest.mock('../../db/books');
jest.mock('../../db/list-items');

describe('listItemsController use cases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getListItem returns the req.listItem', async () => {
    const user = buildUser();
    const book = buildBook();
    const listItem = buildListItem({ ownerId: user.id, bookId: book.id });

    booksDB.readById.mockResolvedValueOnce(book);

    const req = buildReq({ listItem });
    const res = buildRes();

    await listItemsController.getListItem(req, res);

    expect(booksDB.readById).toHaveBeenCalledWith(listItem.bookId);
    expect(booksDB.readById).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith({ listItem: { ...listItem, book } });
  });

  test('should return 400 if bookId was not provider', async () => {
    const req = buildReq();
    const res = buildRes();

    await listItemsController.createListItem(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.status).not.toHaveBeenCalledWith(401);
    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledTimes(1);
    expect(res.json.mock.calls[0]).toMatchInlineSnapshot(`
      Array [
        Object {
          "message": "No bookId provided",
        },
      ]
    `);
  });

  test('should setListItem sets the listItem', async () => {
    const res = buildRes();
    const user = buildUser();
    const listItem = buildListItem({ ownerId: user.id });
    const next = buildNext();
    const req = buildReq({
      user,
      params: { id: listItem.id },
    });

    listItemsDB.readById.mockResolvedValueOnce(listItem);

    await listItemsController.setListItem(req, res, next);

    expect(next).toHaveBeenCalledWith(/* nothing */);
    expect(listItemsDB.readById).toHaveBeenCalledTimes(1);
    expect(listItemsDB.readById).toHaveBeenCalledWith(listItem.id);
    expect(req.listItem).toBe(listItem);
  });

  test('should setListItem return 404 if no listItem', async () => {
    const res = buildRes();
    const next = buildNext();
    const FAKE_ID = 'FAKE_ID';
    const req = buildReq({ params: { id: FAKE_ID } });

    listItemsDB.readById.mockResolvedValueOnce(null);

    await listItemsController.setListItem(req, res, next);

    expect(listItemsDB.readById).toHaveBeenCalledWith(FAKE_ID);
    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.status).not.toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledTimes(1);
    expect(next).not.toHaveBeenCalled();
    expect(res.json.mock.calls[0]).toMatchInlineSnapshot(`
      Array [
        Object {
          "message": "No list item was found with the id of FAKE_ID",
        },
      ]
    `);
  });

  test('should setListItem returns 403 if no user.id and ownerId does not match', async () => {
    const res = buildRes();
    const user = buildUser({ id: '1' });
    const listItem = buildListItem({ id: '2' });
    const next = buildNext();
    const req = buildReq({
      user,
      params: { id: listItem.id },
    });

    listItemsDB.readById.mockResolvedValueOnce(listItem);

    await listItemsController.setListItem(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.status).toHaveBeenCalledTimes(1);
    expect(next).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledTimes(1);
    expect(res.json.mock.calls[0]).toMatchInlineSnapshot(`
      Array [
        Object {
          "message": "User with id 1 is not authorized to access the list item 2",
        },
      ]
    `);
  });

  test('should getListItems return a array of listItems', async () => {
    const books = [buildBook(), buildBook()];
    const user = buildUser();
    const userListItem = [
      buildListItem({ ownerId: user.id, bookId: books[0].id }),
      buildListItem({ ownerId: user.id, bookId: books[1].id }),
    ];
    booksDB.readManyById.mockResolvedValueOnce(books);
    listItemsDB.query.mockResolvedValueOnce(userListItem);

    const res = buildRes();
    const req = buildReq({ user });

    await listItemsController.getListItems(req, res);

    expect(listItemsDB.query).toHaveBeenCalledWith({ ownerId: user.id });
    expect(listItemsDB.query).toHaveBeenCalledTimes(1);
    expect(booksDB.readManyById).toHaveBeenCalledWith([
      books[0].id,
      books[1].id,
    ]);
  });

  test('should createListItem creates and returns a list item', async () => {
    const user = buildUser();
    const book = buildBook();

    const createdListItem = buildListItem({
      ownerId: user.id,
      bookId: book.id,
    });

    listItemsDB.query.mockResolvedValueOnce([]);
    listItemsDB.create.mockResolvedValueOnce(createdListItem);
    booksDB.readById.mockResolvedValueOnce(book);

    const req = buildReq({ user, body: { bookId: book.id } });
    const res = buildRes();

    await listItemsController.createListItem(req, res);

    expect(res.json).toHaveBeenLastCalledWith({
      listItem: { ...createdListItem, book },
    });
    expect(res.json).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
    expect(listItemsDB.query).toHaveBeenCalledWith({
      ownerId: user.id,
      bookId: book.id,
    });
    expect(listItemsDB.query).toHaveBeenCalledTimes(1);
    expect(listItemsDB.create).toHaveBeenCalledWith({
      ownerId: user.id,
      bookId: book.id,
    });
    expect(listItemsDB.create).toHaveBeenCalledTimes(1);
    expect(booksDB.readById).toHaveBeenCalledWith(book.id);
    expect(booksDB.readById).toHaveBeenCalledTimes(1);
  });

  test('should createListItem returns 400 when bookId was not provided', async () => {
    const req = buildReq();
    const res = buildRes();

    await listItemsController.createListItem(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json.mock.calls[0]).toMatchInlineSnapshot(`
      Array [
        Object {
          "message": "No bookId provided",
        },
      ]
    `);
    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledTimes(1);
  });

  test('should createListItem returns 400 if listItem already exists', async () => {
    const user = buildUser({ id: 'userid' });
    const book = buildBook({ id: 'bookid' });

    const req = buildReq({ user, body: { bookId: book.id } });
    const res = buildRes();

    const createdListItem = buildListItem({
      ownerId: user.id,
      bookId: book.id,
    });

    listItemsDB.query.mockResolvedValueOnce([createdListItem]);

    await listItemsController.createListItem(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json.mock.calls[0]).toMatchInlineSnapshot(`
      Array [
        Object {
          "message": "User userid already has a list item for the book with the ID bookid",
        },
      ]
    `);
    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledTimes(1);
    expect(listItemsDB.query).toHaveBeenCalledWith({
      ownerId: user.id,
      bookId: book.id,
    });
    expect(listItemsDB.query).toHaveBeenCalledTimes(1);
  });

  test('should updateListItem returns a updated list item', async () => {
    const book = buildBook();
    const createdListItem = buildListItem();
    const newListItem = buildListItem({
      id: createdListItem.id,
      bookId: book.id,
    });
    const req = buildReq({
      listItem: createdListItem,
      body: newListItem,
    });
    const res = buildRes();

    listItemsDB.update.mockResolvedValueOnce(newListItem);
    booksDB.readById.mockResolvedValueOnce(book);

    await listItemsController.updateListItem(req, res);

    expect(res.json).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith({
      listItem: { ...newListItem, book },
    });
    expect(booksDB.readById).toHaveBeenCalledWith(book.id);
    expect(booksDB.readById).toHaveBeenCalledTimes(1);
    expect(listItemsDB.update).toHaveBeenCalledWith(
      createdListItem.id,
      newListItem,
    );
    expect(listItemsDB.update).toHaveBeenCalledTimes(1);
  });

  test('should deleteListItem deletes an item and return success', async () => {
    const listItem = buildListItem();

    const res = buildRes();
    const req = buildReq({ listItem });

    await listItemsController.deleteListItem(req, res);

    expect(res.json).toHaveBeenCalledTimes(1);
    expect(res.json.mock.calls[0]).toMatchInlineSnapshot(`
      Array [
        Object {
          "success": true,
        },
      ]
    `);
    expect(listItemsDB.remove).toHaveBeenCalledWith(listItem.id);
  });
});
