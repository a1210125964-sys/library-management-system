package com.lms.service;

import com.lms.dto.BookRequest;
import com.lms.exception.BusinessException;
import com.lms.model.Book;
import com.lms.repository.BookRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class BookService {

    private final BookRepository bookRepository;

    public BookService(BookRepository bookRepository) {
        this.bookRepository = bookRepository;
    }

    @Transactional
    public Book create(BookRequest req) {
        if (bookRepository.existsByIsbn(req.getIsbn())) {
            throw new BusinessException("ISBN 已存在");
        }
        Book book = new Book();
        merge(book, req);
        book.setAvailableStock(req.getStock());
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

    public Book findById(Long id) {
        return bookRepository.findById(id).orElseThrow(() -> new BusinessException("图书不存在"));
    }

    public List<Book> list(String keyword) {
        if (keyword == null || keyword.isBlank()) {
            return bookRepository.findAll();
        }
        return bookRepository.findByTitleContainingIgnoreCaseOrAuthorContainingIgnoreCaseOrIsbnContainingIgnoreCaseOrCategoryContainingIgnoreCase(
            keyword, keyword, keyword, keyword
        );
    }

    private void merge(Book book, BookRequest req) {
        book.setTitle(req.getTitle());
        book.setAuthor(req.getAuthor());
        book.setPublisher(req.getPublisher());
        book.setIsbn(req.getIsbn());
        book.setCategory(req.getCategory());
        book.setStock(req.getStock());
    }
}
