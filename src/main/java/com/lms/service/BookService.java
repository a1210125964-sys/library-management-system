package com.lms.service;

import com.lms.dto.BookRequest;
import com.lms.exception.BusinessException;
import com.lms.model.Book;
import com.lms.repository.BookRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class BookService {

    private final BookRepository bookRepository;
    private final BookCategoryService bookCategoryService;

    public BookService(BookRepository bookRepository, BookCategoryService bookCategoryService) {
        this.bookRepository = bookRepository;
        this.bookCategoryService = bookCategoryService;
    }

    @Transactional
    public Book create(BookRequest req) {
        if (bookRepository.existsByIsbn(req.getIsbn())) {
            throw new BusinessException("ISBN 已存在");
        }
        Book book = new Book();
        merge(book, req);
        book.setAvailableStock(req.getStock());
        book.setActive(true);
        book.setCreatedAt(LocalDateTime.now());
        book.setUpdatedAt(LocalDateTime.now());
        return bookRepository.save(book);
    }

    @Transactional
    public Book update(Long id, BookRequest req) {
        Book book = findById(id);
        if (!book.getIsbn().equals(req.getIsbn()) && bookRepository.existsByIsbn(req.getIsbn())) {
            throw new BusinessException("ISBN 已存在");
        }

        int borrowedCount = book.getStock() - book.getAvailableStock();
        if (req.getStock() < borrowedCount) {
            throw new BusinessException("库存不能小于当前借出数量");
        }

        merge(book, req);
        book.setAvailableStock(req.getStock() - borrowedCount);
        book.setUpdatedAt(LocalDateTime.now());
        return bookRepository.save(book);
    }

    @Transactional
    public void delete(Long id) {
        Book book = findById(id);
        if (book.getAvailableStock() < book.getStock()) {
            throw new BusinessException("存在未归还借阅记录，无法删除图书");
        }
        bookRepository.delete(book);
    }

    @Transactional
    public Book shelve(Long id, boolean active) {
        Book book = findById(id);
        if (!active && book.getAvailableStock() < book.getStock()) {
            throw new BusinessException("存在未归还借阅记录，无法下架图书");
        }
        book.setActive(active);
        book.setUpdatedAt(LocalDateTime.now());
        return bookRepository.save(book);
    }

    public Book findById(Long id) {
        return bookRepository.findById(id).orElseThrow(() -> new BusinessException("图书不存在"));
    }

    public List<Book> list(String keyword) {
        if (keyword == null || keyword.isBlank()) {
            return bookRepository.findByActiveTrue();
        }
        return bookRepository.findByActiveTrueAndKeyword(keyword);
    }

    public Page<Book> listPage(String keyword, int page, int size) {
        int safePage = Math.max(0, page);
        int safeSize = Math.max(1, Math.min(size, 100));
        Pageable pageable = PageRequest.of(safePage, safeSize, Sort.by(Sort.Direction.ASC, "id"));
        if (keyword == null || keyword.isBlank()) {
            return bookRepository.findByActiveTrue(pageable);
        }
        return bookRepository.findByActiveTrueAndKeyword(keyword, pageable);
    }

    public Page<Book> listAllPage(String keyword, int page, int size) {
        int safePage = Math.max(0, page);
        int safeSize = Math.max(1, Math.min(size, 100));
        Pageable pageable = PageRequest.of(safePage, safeSize, Sort.by(Sort.Direction.ASC, "id"));
        if (keyword == null || keyword.isBlank()) {
            return bookRepository.findAll(pageable);
        }
        return bookRepository.findByTitleContainingIgnoreCaseOrAuthorContainingIgnoreCaseOrIsbnContainingIgnoreCaseOrCategoryContainingIgnoreCase(
            keyword, keyword, keyword, keyword, pageable
        );
    }

    @Transactional
    public void decreaseAvailableStockOrThrow(Long bookId) {
        int updated = bookRepository.decreaseAvailableStockIfEnough(bookId);
        if (updated == 0) {
            throw new BusinessException("库存不足，无法借阅");
        }
    }

    @Transactional
    public void increaseAvailableStock(Long bookId) {
        bookRepository.increaseAvailableStock(bookId);
    }

    private void merge(Book book, BookRequest req) {
        book.setTitle(req.getTitle());
        book.setAuthor(req.getAuthor());
        book.setPublisher(req.getPublisher());
        book.setIsbn(req.getIsbn());
        String category = req.getCategory() == null ? "" : req.getCategory().trim();
        if (category.isBlank()) {
            throw new BusinessException("图书分类不能为空");
        }
        bookCategoryService.ensureExists(category);
        book.setCategory(category);
        book.setStock(req.getStock());
    }
}
